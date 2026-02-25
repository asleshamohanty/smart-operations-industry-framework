"""
Authentication utilities for FastAPI
"""
from fastapi import HTTPException, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
import os
from typing import Optional
from supabase import create_client, Client

security = HTTPBearer(auto_error=False)

def get_supabase_client() -> Client:
    """Get Supabase client"""
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_KEY")
    
    if not url or not key:
        raise Exception("Supabase credentials not found")
    
    return create_client(url, key)

def get_current_user_id(request: Request, credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> str:
    """
    Get current user ID from Supabase JWT token
    
    This function extracts the user ID from the Supabase JWT token
    sent in the Authorization header.
    """
    try:
        # Get Supabase client
        supabase = get_supabase_client()
        
        # Get the JWT token from the Authorization header
        if not credentials:
            raise HTTPException(status_code=401, detail="Authorization header missing")
        
        token = credentials.credentials
        
        # Verify the JWT token with Supabase
        try:
            # Use Supabase to verify the JWT token
            response = supabase.auth.get_user(token)
            if response.user:
                return response.user.id
            else:
                raise HTTPException(status_code=401, detail="Invalid token")
        except Exception as e:
            raise HTTPException(status_code=401, detail="Invalid or expired token")
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail="Authentication failed")

def get_current_user_id_optional(request: Request, credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> Optional[str]:
    """
    Get current user ID from Supabase JWT token (optional)
    
    Returns None if no valid token is provided, instead of raising an exception.
    """
    try:
        return get_current_user_id(request, credentials)
    except HTTPException:
        return None
