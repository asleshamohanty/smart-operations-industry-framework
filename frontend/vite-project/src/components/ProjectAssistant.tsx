import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MessageCircle, Send, X, Bot, User, Loader2 } from "lucide-react";
import {
  aiChatService,
  ProjectContext,
  AIResponse,
} from "@/lib/ai-chat-service";
import { apiService } from "@/lib/api-services";
import { useTranslation } from "@/contexts/TranslationContext";
import ReactMarkdown from "react-markdown";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  model?: "llama3" | "gemini";
}

interface ProjectAssistantProps {
  isOpen: boolean;
  onToggle: () => void;
}

export const ProjectAssistant: React.FC<ProjectAssistantProps> = ({
  isOpen,
  onToggle,
}) => {
  const { translate } = useTranslation();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [projectContext, setProjectContext] = useState<ProjectContext | null>(
    null
  );
  const [projects, setProjects] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load projects when chatbot is opened
  useEffect(() => {
    if (isOpen) {
      loadProjects();
    }
  }, [isOpen]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const loadProjects = async () => {
    try {
      console.log("Loading projects...");
      console.log(
        "API Base URL:",
        import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000"
      );
      const projectsData = await apiService.getProjects();
      console.log("Loaded projects:", projectsData);
      console.log("Projects count:", projectsData.length);
      setProjects(projectsData);

      // Add debug message to chat
      addMessage(
        "assistant",
        `✅ ${translate("assistant.projectsAvailable")}: ${
          projectsData.length
        }! ${translate("assistant.selectProject")}`
      );
    } catch (error) {
      console.error("Failed to load projects:", error);
      console.error("Error details:", error);
      addMessage(
        "assistant",
        `❌ ${translate("error.loadingProjects")}: ${
          error instanceof Error ? error.message : translate("error.unknown")
        }.`
      );
    }
  };

  const addMessage = (
    role: "user" | "assistant",
    content: string,
    model?: "llama3" | "gemini"
  ) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      role,
      content,
      timestamp: new Date(),
      model,
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  const handleProjectSelect = async (projectId: string) => {
    console.log("Project selected:", projectId);
    const projectIdNum = parseInt(projectId);
    setSelectedProject(projectIdNum);

    try {
      console.log("Fetching project details for ID:", projectIdNum);
      // Fetch project details
      const project = await apiService.getProject(projectIdNum);
      console.log("Project details:", project);

      const materialsUrl = `${
        import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000"
      }/projects/${projectIdNum}/materials`;
      console.log("Fetching materials from:", materialsUrl);

      const materials = await fetch(materialsUrl).then((res) => res.json());
      console.log("Materials:", materials);

      const context: ProjectContext = {
        project_id: projectIdNum,
        project_name: project.project_name,
        location: project.location,
        project_budget: project.project_budget,
        currency: project.currency,
        project_type: project.project_type,
        description: project.description,
        materials: materials.map((material: any) => ({
          name: material.name,
          quantity: material.quantity,
          unit: material.unit,
          import_location: material.import_location,
        })),
        progress: 0, // Default progress
      };

      console.log("Project context created:", context);
      setProjectContext(context);

      // Add welcome message
      addMessage(
        "assistant",
        `Great! I'm now ready to help you with "${project.project_name}". What would you like to know about this project?`
      );
    } catch (error) {
      console.error("Failed to load project details:", error);
      addMessage(
        "assistant",
        `Sorry, I couldn't load the project details. Error: ${
          error instanceof Error ? error.message : "Unknown error"
        }. Please try selecting another project.`
      );
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = inputMessage.trim();
    setInputMessage("");
    addMessage("user", userMessage);
    setIsLoading(true);

    try {
      const conversationHistory = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      const response: AIResponse = await aiChatService.generateResponse(
        userMessage,
        projectContext,
        conversationHistory
      );

      addMessage("assistant", response.content, response.model);
    } catch (error) {
      console.error("Failed to get AI response:", error);
      addMessage(
        "assistant",
        "Sorry, I encountered an error. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    setInputMessage(prompt);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickPrompts = projectContext
    ? aiChatService.getQuickPrompts(projectContext)
    : aiChatService.getQuickPrompts(null);

  if (!isOpen) {
    return (
      <Button
        onClick={onToggle}
        className="fixed bottom-6 right-6 h-16 w-16 rounded-full bg-blue-600 hover:bg-blue-700 shadow-xl z-[9999] transition-all duration-300 hover:scale-110"
        size="icon"
      >
        <MessageCircle className="h-7 w-7 text-white" />
      </Button>
    );
  }

  return (
    <>
      <style>
        {`
          .chatbot-select-content {
            z-index: 10000 !important;
          }
          .chatbot-select-content [data-radix-popper-content-wrapper] {
            z-index: 10000 !important;
          }
        `}
      </style>
      <div
        className="fixed bottom-0 right-0 w-full max-w-md h-[70vh] bg-white border-t border-l border-gray-200 shadow-2xl z-[9999] flex flex-col overflow-hidden"
        style={{ zIndex: 9999 }}
      >
        {/* Header */}
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bot className="h-5 w-5 text-blue-600" />
              {translate("assistant.title")} 🤖
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={onToggle}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Project Selection */}
          {!selectedProject && (
            <div className="mt-3">
              <p className="text-sm text-gray-600 mb-2">
                {translate("assistant.selectProject")}
              </p>
              <p className="text-xs text-gray-500 mb-2">
                {translate("assistant.availableProjects")}: {projects.length}
              </p>
              {projects.length === 0 ? (
                <div className="text-xs text-red-500 mb-2">
                  ⚠️ {translate("assistant.noProjects")}
                </div>
              ) : (
                <div className="text-xs text-green-500 mb-2">
                  ✅ {projects.length}{" "}
                  {translate("assistant.projectsAvailable")}
                </div>
              )}
              <Select onValueChange={handleProjectSelect}>
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={translate(
                      "assistant.selectProjectPlaceholder"
                    )}
                  />
                </SelectTrigger>
                <SelectContent
                  className="chatbot-select-content z-[10000] max-h-[200px] overflow-y-auto"
                  position="popper"
                  side="top"
                  align="start"
                  sideOffset={4}
                  style={{ zIndex: 10000 }}
                >
                  {projects.map((project) => (
                    <SelectItem
                      key={project.project_id}
                      value={project.project_id.toString()}
                    >
                      {project.project_name} - {project.location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Selected Project Info */}
          {selectedProject && projectContext && (
            <div className="mt-3">
              <Badge variant="secondary" className="text-xs">
                📋 {projectContext.project_name}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedProject(null);
                  setProjectContext(null);
                  setMessages([]);
                }}
                className="ml-2 text-xs"
              >
                {translate("assistant.changeProject")}
              </Button>
            </div>
          )}
        </CardHeader>

        {/* Quick Prompts */}
        {selectedProject && (
          <div className="p-3 border-b bg-gray-50">
            <p className="text-xs text-gray-600 mb-2">
              {translate("assistant.quickPrompts")}
            </p>
            <div className="flex flex-wrap gap-1">
              {quickPrompts.slice(0, 4).map((prompt, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => handleQuickPrompt(prompt)}
                >
                  {prompt}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Chat Messages */}
        <ScrollArea className="flex-1 p-3">
          <div className="space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 ${
                    message.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-900"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {message.role === "user" ? (
                      <User className="h-3 w-3" />
                    ) : (
                      <Bot className="h-3 w-3" />
                    )}
                    <span className="text-xs opacity-70">
                      {message.timestamp.toLocaleTimeString()}
                    </span>
                    {message.model && (
                      <Badge variant="outline" className="text-xs">
                        {message.model}
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm prose prose-sm max-w-none">
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg px-3 py-2 flex items-center gap-2">
                  <Bot className="h-3 w-3" />
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span className="text-sm text-gray-600">
                    {translate("assistant.thinking")}
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="p-3 border-t bg-white">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                selectedProject
                  ? translate("assistant.askAboutProject")
                  : translate("assistant.selectProjectFirst")
              }
              disabled={!selectedProject || isLoading}
              className="flex-1"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || !selectedProject || isLoading}
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};
