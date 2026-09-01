from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.database import init_db
from app.api.documents import router as documents_router
from app.api.metrics import router as metrics_router

app = FastAPI(
    title="MedParse API",
    description="Clinical Document Processing & Structured Extraction Engine for Hospital Billing & Claims Operations.",
    version="1.0.0"
)

# CORS configuration for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize SQLite database on startup
@app.on_event("startup")
def startup_event():
    init_db()

# Include API routers
app.include_router(documents_router)
app.include_router(metrics_router)

@app.get("/")
def root():
    return {
        "system": "MedParse Clinical Operations Engine",
        "status": "online",
        "version": "1.0.0",
        "environment": "demo-mode",
        "documentation": "/docs"
    }

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "database": "sqlite_active", "ocr_service": "online"}
