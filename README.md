# 🏥 MedParse

> **AI-powered medical document processing for faster, smarter insurance claims.**

MedParse transforms unstructured medical documents into **structured, reviewable, claim-ready information** using AI-assisted extraction and human verification.

## 🚀 What it does

- 📄 Upload medical documents
- 🤖 Extract patient & medical information using AI
- 🔍 Validate extracted information with confidence scores
- 👨‍⚕️ Review and correct extracted fields
- 📊 Track documents and processing status
- 🧾 Generate claim-ready information
- 🔐 Secure user authentication and user-specific documents

## 💡 Workflow

```text
Upload
  ↓
OCR / Text Extraction
  ↓
AI Extraction
  ↓
Validation & Confidence Score
  ↓
Human Review
  ↓
Claim Ready
🛠️ Tech Stack

Frontend: Next.js • React • TypeScript
Backend: FastAPI • Python
Database: Database-backed document storage
AI: AI-assisted medical information extraction
Auth: Secure user authentication

▶️ Run Locally
Backend
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
Frontend
cd frontend
npm install
npm run dev

Open http://localhost:3000

Backend API docs: http://localhost:8000/docs

🎯 Why MedParse?

Medical claims involve large amounts of documentation and repetitive manual work.

MedParse bridges the gap between documents and claims by combining AI automation with human verification.

Less manual work. More accuracy. Faster claims.
