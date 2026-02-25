"""
Intelligent Anomaly Analysis Service
Provides actionable recommendations and automated responses for detected anomalies
"""

import os
import json
import pandas as pd
import numpy as np
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from enum import Enum

class AnomalySeverity(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class AnomalyType(Enum):
    COST_OVERRUN = "cost_overrun"
    SCHEDULE_DELAY = "schedule_delay"
    QUALITY_ISSUE = "quality_issue"
    SAFETY_CONCERN = "safety_concern"
    RESOURCE_SHORTAGE = "resource_shortage"
    WEATHER_IMPACT = "weather_impact"
    EQUIPMENT_FAILURE = "equipment_failure"
    SUPPLY_CHAIN_DISRUPTION = "supply_chain_disruption"

class IntelligentAnomalyAnalyzer:
    def __init__(self):
        self.anomaly_patterns = self._load_anomaly_patterns()
        self.response_templates = self._load_response_templates()
    
    def _load_anomaly_patterns(self) -> Dict[str, Dict]:
        """Load predefined anomaly patterns and their characteristics"""
        return {
            "cost_overrun": {
                "indicators": ["planned_task_cost", "material_unit_cost", "labor_cost"],
                "thresholds": {"high": 1.2, "critical": 1.5},
                "severity_mapping": {
                    "low": 1.1,
                    "medium": 1.2,
                    "high": 1.4,
                    "critical": 1.6
                }
            },
            "schedule_delay": {
                "indicators": ["duration_days", "completion_percentage"],
                "thresholds": {"high": 1.3, "critical": 1.6},
                "severity_mapping": {
                    "low": 1.1,
                    "medium": 1.25,
                    "high": 1.4,
                    "critical": 1.7
                }
            },
            "quality_issue": {
                "indicators": ["quality_score", "defect_rate", "rework_percentage"],
                "thresholds": {"high": 0.8, "critical": 0.6},
                "severity_mapping": {
                    "low": 0.9,
                    "medium": 0.8,
                    "high": 0.7,
                    "critical": 0.5
                }
            },
            "safety_concern": {
                "indicators": ["safety_score", "incident_rate", "near_miss_count"],
                "thresholds": {"high": 0.7, "critical": 0.5},
                "severity_mapping": {
                    "low": 0.9,
                    "medium": 0.8,
                    "high": 0.6,
                    "critical": 0.4
                }
            },
            "resource_shortage": {
                "indicators": ["labor_availability", "equipment_utilization", "material_supply"],
                "thresholds": {"high": 0.8, "critical": 0.6},
                "severity_mapping": {
                    "low": 0.9,
                    "medium": 0.8,
                    "high": 0.7,
                    "critical": 0.5
                }
            },
            "weather_impact": {
                "indicators": ["weather_delay_factor", "outdoor_work_percentage"],
                "thresholds": {"high": 1.3, "critical": 1.6},
                "severity_mapping": {
                    "low": 1.1,
                    "medium": 1.25,
                    "high": 1.4,
                    "critical": 1.8
                }
            },
            "equipment_failure": {
                "indicators": ["equipment_downtime", "maintenance_frequency", "breakdown_rate"],
                "thresholds": {"high": 0.8, "critical": 0.6},
                "severity_mapping": {
                    "low": 0.9,
                    "medium": 0.8,
                    "high": 0.7,
                    "critical": 0.5
                }
            },
            "supply_chain_disruption": {
                "indicators": ["material_delivery_delay", "supplier_reliability", "inventory_levels"],
                "thresholds": {"high": 0.8, "critical": 0.6},
                "severity_mapping": {
                    "low": 0.9,
                    "medium": 0.8,
                    "high": 0.7,
                    "critical": 0.5
                }
            }
        }
    
    def _load_response_templates(self) -> Dict[str, Dict]:
        """Load response templates for different anomaly types and severities"""
        return {
            "cost_overrun": {
                "low": {
                    "immediate_actions": [
                        "Review budget allocation and identify cost-saving opportunities",
                        "Negotiate with suppliers for better pricing",
                        "Optimize resource utilization"
                    ],
                    "preventive_measures": [
                        "Implement stricter budget controls",
                        "Set up weekly cost monitoring",
                        "Create contingency budget reserves"
                    ],
                    "escalation": "Notify project manager for budget review"
                },
                "medium": {
                    "immediate_actions": [
                        "Freeze non-essential purchases",
                        "Reallocate resources from lower priority tasks",
                        "Request additional funding approval"
                    ],
                    "preventive_measures": [
                        "Implement daily cost tracking",
                        "Set up automated budget alerts",
                        "Create cost reduction task force"
                    ],
                    "escalation": "Escalate to senior management and stakeholders"
                },
                "high": {
                    "immediate_actions": [
                        "Stop all non-critical work",
                        "Emergency budget review meeting",
                        "Consider project scope reduction"
                    ],
                    "preventive_measures": [
                        "Implement real-time cost monitoring",
                        "Set up emergency approval processes",
                        "Create crisis management team"
                    ],
                    "escalation": "Immediate escalation to C-level executives"
                },
                "critical": {
                    "immediate_actions": [
                        "Emergency project halt",
                        "Immediate stakeholder notification",
                        "Crisis management activation"
                    ],
                    "preventive_measures": [
                        "Implement fail-safe budget controls",
                        "Set up 24/7 monitoring systems",
                        "Create emergency response protocols"
                    ],
                    "escalation": "Board-level notification and emergency meeting"
                }
            },
            "schedule_delay": {
                "low": {
                    "immediate_actions": [
                        "Adjust task priorities",
                        "Increase resource allocation",
                        "Optimize work sequences"
                    ],
                    "preventive_measures": [
                        "Implement daily progress tracking",
                        "Set up milestone alerts",
                        "Create buffer time in schedules"
                    ],
                    "escalation": "Notify project manager for schedule review"
                },
                "medium": {
                    "immediate_actions": [
                        "Reallocate resources from other projects",
                        "Implement overtime work",
                        "Consider parallel task execution"
                    ],
                    "preventive_measures": [
                        "Set up real-time schedule monitoring",
                        "Create contingency plans",
                        "Implement agile project management"
                    ],
                    "escalation": "Escalate to senior management"
                },
                "high": {
                    "immediate_actions": [
                        "Emergency resource mobilization",
                        "Critical path analysis and optimization",
                        "Consider project scope reduction"
                    ],
                    "preventive_measures": [
                        "Implement 24/7 project monitoring",
                        "Create emergency response protocols",
                        "Set up crisis management team"
                    ],
                    "escalation": "Immediate escalation to C-level executives"
                },
                "critical": {
                    "immediate_actions": [
                        "Emergency project halt",
                        "Immediate stakeholder notification",
                        "Crisis management activation"
                    ],
                    "preventive_measures": [
                        "Implement fail-safe schedule controls",
                        "Set up emergency response protocols",
                        "Create board-level reporting"
                    ],
                    "escalation": "Board-level notification and emergency meeting"
                }
            },
            "quality_issue": {
                "low": {
                    "immediate_actions": [
                        "Increase quality inspections",
                        "Provide additional training",
                        "Review quality standards"
                    ],
                    "preventive_measures": [
                        "Implement daily quality checks",
                        "Set up quality alerts",
                        "Create quality improvement team"
                    ],
                    "escalation": "Notify quality manager"
                },
                "medium": {
                    "immediate_actions": [
                        "Stop work on affected areas",
                        "Implement corrective actions",
                        "Increase supervision"
                    ],
                    "preventive_measures": [
                        "Set up real-time quality monitoring",
                        "Implement quality gates",
                        "Create quality assurance protocols"
                    ],
                    "escalation": "Escalate to senior management"
                },
                "high": {
                    "immediate_actions": [
                        "Emergency quality review",
                        "Implement immediate corrective measures",
                        "Consider work stoppage"
                    ],
                    "preventive_measures": [
                        "Implement 24/7 quality monitoring",
                        "Create emergency quality protocols",
                        "Set up crisis management team"
                    ],
                    "escalation": "Immediate escalation to C-level executives"
                },
                "critical": {
                    "immediate_actions": [
                        "Emergency project halt",
                        "Immediate stakeholder notification",
                        "Crisis management activation"
                    ],
                    "preventive_measures": [
                        "Implement fail-safe quality controls",
                        "Set up emergency response protocols",
                        "Create board-level reporting"
                    ],
                    "escalation": "Board-level notification and emergency meeting"
                }
            },
            "safety_concern": {
                "low": {
                    "immediate_actions": [
                        "Increase safety inspections",
                        "Provide safety training",
                        "Review safety protocols"
                    ],
                    "preventive_measures": [
                        "Implement daily safety checks",
                        "Set up safety alerts",
                        "Create safety improvement team"
                    ],
                    "escalation": "Notify safety manager"
                },
                "medium": {
                    "immediate_actions": [
                        "Stop work in affected areas",
                        "Implement immediate safety measures",
                        "Increase safety supervision"
                    ],
                    "preventive_measures": [
                        "Set up real-time safety monitoring",
                        "Implement safety gates",
                        "Create safety assurance protocols"
                    ],
                    "escalation": "Escalate to senior management"
                },
                "high": {
                    "immediate_actions": [
                        "Emergency safety review",
                        "Implement immediate safety measures",
                        "Consider work stoppage"
                    ],
                    "preventive_measures": [
                        "Implement 24/7 safety monitoring",
                        "Create emergency safety protocols",
                        "Set up crisis management team"
                    ],
                    "escalation": "Immediate escalation to C-level executives"
                },
                "critical": {
                    "immediate_actions": [
                        "Emergency project halt",
                        "Immediate stakeholder notification",
                        "Crisis management activation"
                    ],
                    "preventive_measures": [
                        "Implement fail-safe safety controls",
                        "Set up emergency response protocols",
                        "Create board-level reporting"
                    ],
                    "escalation": "Board-level notification and emergency meeting"
                }
            }
        }
    
    def analyze_anomaly(self, anomaly_data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze anomaly data and provide intelligent recommendations"""
        try:
            # Determine anomaly type
            anomaly_type = self._classify_anomaly_type(anomaly_data)
            
            # Calculate severity
            severity = self._calculate_severity(anomaly_data, anomaly_type)
            
            # Generate recommendations
            recommendations = self._generate_recommendations(anomaly_type, severity, anomaly_data)
            
            # Calculate risk score
            risk_score = self._calculate_risk_score(anomaly_data, severity)
            
            # Generate predictive insights
            predictive_insights = self._generate_predictive_insights(anomaly_data, anomaly_type)
            
            return {
                "anomaly_type": anomaly_type.value,
                "severity": severity.value,
                "risk_score": risk_score,
                "recommendations": recommendations,
                "predictive_insights": predictive_insights,
                "timestamp": datetime.now().isoformat(),
                "analysis_confidence": self._calculate_confidence(anomaly_data, anomaly_type)
            }
            
        except Exception as e:
            return {
                "error": f"Analysis failed: {str(e)}",
                "timestamp": datetime.now().isoformat()
            }
    
    def _classify_anomaly_type(self, data: Dict[str, Any]) -> AnomalyType:
        """Classify the type of anomaly based on data patterns"""
        # Simple rule-based classification (can be enhanced with ML)
        if data.get("cost_deviation", 0) > 0.2:
            return AnomalyType.COST_OVERRUN
        elif data.get("schedule_deviation", 0) > 0.2:
            return AnomalyType.SCHEDULE_DELAY
        elif data.get("quality_score", 1.0) < 0.8:
            return AnomalyType.QUALITY_ISSUE
        elif data.get("safety_score", 1.0) < 0.8:
            return AnomalyType.SAFETY_CONCERN
        elif data.get("resource_availability", 1.0) < 0.8:
            return AnomalyType.RESOURCE_SHORTAGE
        elif data.get("weather_impact", 1.0) > 1.3:
            return AnomalyType.WEATHER_IMPACT
        elif data.get("equipment_downtime", 0) > 0.2:
            return AnomalyType.EQUIPMENT_FAILURE
        else:
            return AnomalyType.SUPPLY_CHAIN_DISRUPTION
    
    def _calculate_severity(self, data: Dict[str, Any], anomaly_type: AnomalyType) -> AnomalySeverity:
        """Calculate severity based on anomaly type and data values"""
        pattern = self.anomaly_patterns.get(anomaly_type.value, {})
        severity_mapping = pattern.get("severity_mapping", {})
        
        # Get the primary indicator value
        primary_indicator = pattern.get("indicators", [""])[0]
        value = data.get(primary_indicator, 1.0)
        
        # Determine severity based on thresholds
        if value >= severity_mapping.get("critical", 1.6):
            return AnomalySeverity.CRITICAL
        elif value >= severity_mapping.get("high", 1.4):
            return AnomalySeverity.HIGH
        elif value >= severity_mapping.get("medium", 1.2):
            return AnomalySeverity.MEDIUM
        else:
            return AnomalySeverity.LOW
    
    def _generate_recommendations(self, anomaly_type: AnomalyType, severity: AnomalySeverity, data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate actionable recommendations based on anomaly type and severity"""
        response_template = self.response_templates.get(anomaly_type.value, {})
        severity_response = response_template.get(severity.value, {})
        
        return {
            "immediate_actions": severity_response.get("immediate_actions", []),
            "preventive_measures": severity_response.get("preventive_measures", []),
            "escalation": severity_response.get("escalation", ""),
            "priority": self._get_priority(severity),
            "estimated_resolution_time": self._get_estimated_resolution_time(severity),
            "required_resources": self._get_required_resources(anomaly_type, severity)
        }
    
    def _calculate_risk_score(self, data: Dict[str, Any], severity: AnomalySeverity) -> float:
        """Calculate overall risk score (0-100)"""
        base_scores = {
            AnomalySeverity.LOW: 25,
            AnomalySeverity.MEDIUM: 50,
            AnomalySeverity.HIGH: 75,
            AnomalySeverity.CRITICAL: 95
        }
        
        base_score = base_scores.get(severity, 50)
        
        # Adjust based on additional factors
        if data.get("trend", "stable") == "increasing":
            base_score += 10
        elif data.get("trend", "stable") == "decreasing":
            base_score -= 5
        
        return min(100, max(0, base_score))
    
    def _generate_predictive_insights(self, data: Dict[str, Any], anomaly_type: AnomalyType) -> List[str]:
        """Generate predictive insights based on anomaly patterns"""
        insights = []
        
        if anomaly_type == AnomalyType.COST_OVERRUN:
            insights.extend([
                "Cost overrun trend suggests potential budget shortfall within 2-3 weeks",
                "Consider implementing cost control measures immediately",
                "Historical data shows similar projects required 15-20% budget increase"
            ])
        elif anomaly_type == AnomalyType.SCHEDULE_DELAY:
            insights.extend([
                "Schedule delay pattern indicates potential 3-4 week extension needed",
                "Critical path analysis suggests resource reallocation required",
                "Weather forecast may impact outdoor work completion"
            ])
        elif anomaly_type == AnomalyType.QUALITY_ISSUE:
            insights.extend([
                "Quality degradation trend may lead to rework costs",
                "Supplier quality issues likely to continue without intervention",
                "Customer satisfaction may be impacted if not addressed"
            ])
        elif anomaly_type == AnomalyType.SAFETY_CONCERN:
            insights.extend([
                "Safety incident risk increases with current trend",
                "Equipment maintenance schedule may need acceleration",
                "Worker safety training refresh recommended"
            ])
        
        return insights
    
    def _calculate_confidence(self, data: Dict[str, Any], anomaly_type: AnomalyType) -> float:
        """Calculate confidence level of the analysis (0-100)"""
        # Simple confidence calculation based on data completeness
        required_fields = self.anomaly_patterns.get(anomaly_type.value, {}).get("indicators", [])
        available_fields = sum(1 for field in required_fields if field in data)
        
        if not required_fields:
            return 50.0
        
        confidence = (available_fields / len(required_fields)) * 100
        return min(100, max(0, confidence))
    
    def _get_priority(self, severity: AnomalySeverity) -> str:
        """Get priority level based on severity"""
        priority_mapping = {
            AnomalySeverity.LOW: "Low",
            AnomalySeverity.MEDIUM: "Medium",
            AnomalySeverity.HIGH: "High",
            AnomalySeverity.CRITICAL: "Critical"
        }
        return priority_mapping.get(severity, "Medium")
    
    def _get_estimated_resolution_time(self, severity: AnomalySeverity) -> str:
        """Get estimated resolution time based on severity"""
        time_mapping = {
            AnomalySeverity.LOW: "1-3 days",
            AnomalySeverity.MEDIUM: "3-7 days",
            AnomalySeverity.HIGH: "1-2 weeks",
            AnomalySeverity.CRITICAL: "Immediate action required"
        }
        return time_mapping.get(severity, "3-7 days")
    
    def _get_required_resources(self, anomaly_type: AnomalyType, severity: AnomalySeverity) -> List[str]:
        """Get required resources based on anomaly type and severity"""
        resources = []
        
        if anomaly_type == AnomalyType.COST_OVERRUN:
            resources.extend(["Financial analyst", "Project manager", "Budget controller"])
        elif anomaly_type == AnomalyType.SCHEDULE_DELAY:
            resources.extend(["Project scheduler", "Resource manager", "Team leads"])
        elif anomaly_type == AnomalyType.QUALITY_ISSUE:
            resources.extend(["Quality engineer", "Inspector", "Training coordinator"])
        elif anomaly_type == AnomalyType.SAFETY_CONCERN:
            resources.extend(["Safety officer", "Site supervisor", "Emergency response team"])
        
        if severity == AnomalySeverity.CRITICAL:
            resources.extend(["Senior management", "Crisis management team"])
        
        return resources

# Global instance
anomaly_analyzer = IntelligentAnomalyAnalyzer()
