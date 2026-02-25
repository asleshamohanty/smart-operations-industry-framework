"""
Anomaly Persistence API Router
Handles CRUD operations for storing and retrieving anomalies in Supabase
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from database import get_supabase_client
from supabase import Client

router = APIRouter(prefix="/anomaly-persistence", tags=["anomaly-persistence"])

class AnomalyCreate(BaseModel):
    anomaly_id: str
    sensor_name: str
    sensor_type: str
    location: str
    value: float
    unit: str
    normal_range_min: float
    normal_range_max: float
    severity: str
    confidence: float
    description: str
    project_id: Optional[int] = None
    deviation_amount: Optional[float] = None
    deviation_percentage: Optional[float] = None

class AnomalyUpdate(BaseModel):
    resolved: Optional[bool] = None
    resolved_by: Optional[str] = None
    description: Optional[str] = None

class AnomalyResponse(BaseModel):
    id: int
    anomaly_id: str
    sensor_name: str
    sensor_type: str
    location: str
    timestamp: datetime
    value: float
    unit: str
    normal_range_min: float
    normal_range_max: float
    severity: str
    confidence: float
    description: str
    resolved: bool
    resolved_at: Optional[datetime]
    resolved_by: Optional[str]
    project_id: Optional[int]
    deviation_amount: Optional[float]
    deviation_percentage: Optional[float]
    created_at: datetime
    updated_at: datetime

@router.post("/anomalies", response_model=AnomalyResponse)
async def create_anomaly(anomaly: AnomalyCreate, db: Client = Depends(get_supabase_client)):
    """Create a new anomaly record"""
    try:
        # Insert anomaly into Supabase
        result = db.table("anomalies").insert({
            "anomaly_id": anomaly.anomaly_id,
            "sensor_name": anomaly.sensor_name,
            "sensor_type": anomaly.sensor_type,
            "location": anomaly.location,
            "value": anomaly.value,
            "unit": anomaly.unit,
            "normal_range_min": anomaly.normal_range_min,
            "normal_range_max": anomaly.normal_range_max,
            "severity": anomaly.severity,
            "confidence": anomaly.confidence,
            "description": anomaly.description,
            "project_id": anomaly.project_id,
            "deviation_amount": anomaly.deviation_amount,
            "deviation_percentage": anomaly.deviation_percentage,
            "resolved": False
        }).execute()

        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to create anomaly")

        # Broadcast update to 3D Twin WebSocket clients
        try:
            from routers.realtime import manager
            from backend.utils.sensor_simulator import get_3d_location
            sensor_update = {
                'id': anomaly.anomaly_id,
                'name': anomaly.sensor_name,
                'type': anomaly.sensor_type,
                'unit': anomaly.unit,
                'value': anomaly.value,
                'normalRange': [anomaly.normal_range_min, anomaly.normal_range_max],
                'location': get_3d_location(anomaly.sensor_type),
                'status': 'anomaly',
                'severity': anomaly.severity,
                'updatedAt': datetime.now().isoformat()
            }
            await manager.broadcast({
                'type': 'update',
                'sensors': [sensor_update],
                'timestamp': datetime.now().isoformat()
            })
        except Exception as ws_error:
            print(f"Failed to broadcast WebSocket update: {ws_error}")

        return AnomalyResponse(**result.data[0])

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating anomaly: {str(e)}")

@router.get("/anomalies", response_model=List[AnomalyResponse])
async def get_anomalies(
    limit: int = 100,
    offset: int = 0,
    severity: Optional[str] = None,
    resolved: Optional[bool] = None,
    project_id: Optional[int] = None,
    sensor_name: Optional[str] = None,
    db: Client = Depends(get_supabase_client)
):
    """Get anomalies with optional filtering"""
    try:
        query = db.table("anomalies").select("*")

        # Apply filters
        if severity:
            query = query.eq("severity", severity)
        if resolved is not None:
            query = query.eq("resolved", resolved)
        if project_id:
            query = query.eq("project_id", project_id)
        if sensor_name:
            query = query.eq("sensor_name", sensor_name)

        # Apply pagination and ordering
        result = query.order("timestamp", desc=True).range(offset, offset + limit - 1).execute()

        return [AnomalyResponse(**anomaly) for anomaly in result.data]

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching anomalies: {str(e)}")

@router.get("/anomalies/{anomaly_id}", response_model=AnomalyResponse)
async def get_anomaly(anomaly_id: str, db: Client = Depends(get_supabase_client)):
    """Get a specific anomaly by anomaly_id"""
    try:
        result = db.table("anomalies").select("*").eq("anomaly_id", anomaly_id).execute()

        if not result.data:
            raise HTTPException(status_code=404, detail="Anomaly not found")

        return AnomalyResponse(**result.data[0])

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching anomaly: {str(e)}")

@router.put("/anomalies/{anomaly_id}", response_model=AnomalyResponse)
async def update_anomaly(
    anomaly_id: str, 
    update_data: AnomalyUpdate, 
    db: Client = Depends(get_supabase_client)
):
    """Update an anomaly"""
    try:
        # Prepare update data
        update_dict = {}
        if update_data.resolved is not None:
            update_dict["resolved"] = update_data.resolved
            if update_data.resolved:
                update_dict["resolved_at"] = datetime.now().isoformat()
            else:
                update_dict["resolved_at"] = None
        if update_data.resolved_by is not None:
            update_dict["resolved_by"] = update_data.resolved_by
        if update_data.description is not None:
            update_dict["description"] = update_data.description

        if not update_dict:
            raise HTTPException(status_code=400, detail="No update data provided")

        # Update anomaly
        result = db.table("anomalies").update(update_dict).eq("anomaly_id", anomaly_id).execute()

        if not result.data:
            raise HTTPException(status_code=404, detail="Anomaly not found")

        return AnomalyResponse(**result.data[0])

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating anomaly: {str(e)}")

@router.delete("/anomalies/{anomaly_id}")
async def delete_anomaly(anomaly_id: str, db: Client = Depends(get_supabase_client)):
    """Delete an anomaly"""
    try:
        result = db.table("anomalies").delete().eq("anomaly_id", anomaly_id).execute()

        if not result.data:
            raise HTTPException(status_code=404, detail="Anomaly not found")

        return {"message": "Anomaly deleted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting anomaly: {str(e)}")

@router.get("/anomalies/stats/summary")
async def get_anomaly_stats(db: Client = Depends(get_supabase_client)):
    """Get anomaly statistics summary"""
    try:
        # Get total count
        total_result = db.table("anomalies").select("id", count="exact").execute()
        total_count = total_result.count

        # Get counts by severity
        severity_result = db.table("anomalies").select("severity").execute()
        severity_counts = {}
        for anomaly in severity_result.data:
            severity = anomaly["severity"]
            severity_counts[severity] = severity_counts.get(severity, 0) + 1

        # Get resolved count
        resolved_result = db.table("anomalies").select("id", count="exact").eq("resolved", True).execute()
        resolved_count = resolved_result.count

        # Get unresolved count
        unresolved_result = db.table("anomalies").select("id", count="exact").eq("resolved", False).execute()
        unresolved_count = unresolved_result.count

        return {
            "total_anomalies": total_count,
            "resolved_anomalies": resolved_count,
            "unresolved_anomalies": unresolved_count,
            "severity_breakdown": severity_counts,
            "timestamp": datetime.now().isoformat()
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching anomaly stats: {str(e)}")

@router.get("/anomalies/recent")
async def get_recent_anomalies(
    hours: int = 24,
    limit: int = 50,
    db: Client = Depends(get_supabase_client)
):
    """Get recent anomalies within specified hours"""
    try:
        # Calculate timestamp threshold
        threshold = datetime.now().timestamp() - (hours * 3600)
        threshold_iso = datetime.fromtimestamp(threshold).isoformat()

        result = db.table("anomalies").select("*").gte("timestamp", threshold_iso).order("timestamp", desc=True).limit(limit).execute()

        return [AnomalyResponse(**anomaly) for anomaly in result.data]

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching recent anomalies: {str(e)}")
