from fastapi import APIRouter, Depends
from app.models.schemas import WorkspaceMetrics
from app.services.auth import get_current_user
from app.db.database import get_workspace_metrics

router = APIRouter(prefix="/api/metrics", tags=["metrics"])

@router.get("", response_model=WorkspaceMetrics)
def get_metrics(current_user: dict = Depends(get_current_user)):
    """
    Returns real-time workspace operational statistics for the authenticated operator.
    """
    return get_workspace_metrics(user_id=current_user["id"])

