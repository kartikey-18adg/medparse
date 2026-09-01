from fastapi import APIRouter
from app.models.schemas import WorkspaceMetrics
from app.db.database import get_workspace_metrics

router = APIRouter(prefix="/api/metrics", tags=["metrics"])

@router.get("", response_model=WorkspaceMetrics)
def get_metrics():
    """
    Returns real-time workspace operational statistics.
    """
    return get_workspace_metrics()
