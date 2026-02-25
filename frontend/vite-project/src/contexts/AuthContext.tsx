import React, { createContext, useContext, useEffect, useState } from "react";
import type { User, Session, AuthError } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithGoogle: () => Promise<{ error: AuthError | null }>;
  signInWithMagicLink: (email: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if Supabase is properly configured using the same logic as supabase.ts
    const supabaseUrl =
      import.meta.env.VITE_SUPABASE_URL ||
      "https://nubbrpaldzantyiejwly.supabase.co";
    const supabaseAnonKey =
      import.meta.env.VITE_SUPABASE_ANON_KEY ||
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51YmJycGFsZHphbnR5aWVqd2x5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5MDYwNjIsImV4cCI6MjA3NTQ4MjA2Mn0.ydpcymatalKeJWDVK2stafXPprr104SXrAakMzaCIGs";

    if (
      supabaseUrl &&
      supabaseAnonKey &&
      supabaseUrl !== "https://your-project.supabase.co" &&
      supabaseAnonKey !== "your-anon-key"
    ) {
      console.log("✅ Supabase configuration looks good!");
      // Get initial session
      supabase.auth
        .getSession()
        .then(({ data: { session } }) => {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
        })
        .catch((error) => {
          console.error("Error getting session:", error);
          setLoading(false);
        });

      // Listen for auth changes
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      });

      return () => subscription.unsubscribe();
    } else {
      console.warn(
        "Supabase not configured. Authentication features disabled."
      );
      console.warn("Please create a .env file in frontend/vite-project/ with:");
      console.warn("VITE_SUPABASE_URL=your_actual_supabase_url");
      console.warn("VITE_SUPABASE_ANON_KEY=your_actual_supabase_anon_key");
      setLoading(false);
    }
  }, []);

  const signInWithGoogle = async () => {
    const supabaseUrl =
      import.meta.env.VITE_SUPABASE_URL ||
      "https://nubbrpaldzantyiejwly.supabase.co";
    const supabaseAnonKey =
      import.meta.env.VITE_SUPABASE_ANON_KEY ||
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51YmJycGFsZHphbnR5aWVqd2x5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5MDYwNjIsImV4cCI6MjA3NTQ4MjA2Mn0.ydpcymatalKeJWDVK2stafXPprr104SXrAakMzaCIGs";

    if (
      !supabaseUrl ||
      !supabaseAnonKey ||
      supabaseUrl === "https://your-project.supabase.co" ||
      supabaseAnonKey === "your-anon-key"
    ) {
      return { error: { message: "Supabase not configured" } as AuthError };
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });
    return { error };
  };

  const signInWithMagicLink = async (email: string) => {
    const supabaseUrl =
      import.meta.env.VITE_SUPABASE_URL ||
      "https://nubbrpaldzantyiejwly.supabase.co";
    const supabaseAnonKey =
      import.meta.env.VITE_SUPABASE_ANON_KEY ||
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51YmJycGFsZHphbnR5aWVqd2x5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5MDYwNjIsImV4cCI6MjA3NTQ4MjA2Mn0.ydpcymatalKeJWDVK2stafXPprr104SXrAakMzaCIGs";

    if (
      !supabaseUrl ||
      !supabaseAnonKey ||
      supabaseUrl === "https://your-project.supabase.co" ||
      supabaseAnonKey === "your-anon-key"
    ) {
      return { error: { message: "Supabase not configured" } as AuthError };
    }

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
      },
    });
    return { error };
  };

  const signOut = async () => {
    const supabaseUrl =
      import.meta.env.VITE_SUPABASE_URL ||
      "https://nubbrpaldzantyiejwly.supabase.co";
    const supabaseAnonKey =
      import.meta.env.VITE_SUPABASE_ANON_KEY ||
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51YmJycGFsZHphbnR5aWVqd2x5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5MDYwNjIsImV4cCI6MjA3NTQ4MjA2Mn0.ydpcymatalKeJWDVK2stafXPprr104SXrAakMzaCIGs";

    if (
      !supabaseUrl ||
      !supabaseAnonKey ||
      supabaseUrl === "https://your-project.supabase.co" ||
      supabaseAnonKey === "your-anon-key"
    ) {
      return { error: { message: "Supabase not configured" } as AuthError };
    }

    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const value = {
    user,
    session,
    loading,
    signInWithGoogle,
    signInWithMagicLink,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
