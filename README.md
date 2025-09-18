# MV Traders - B2B Marketplace

FastAPI (SQLModel) backend + Next.js frontend.

## Folders
- backend/
- frontend/

## Quick start

### Backend
```
cd backend
python -m venv .venv
. .venv/Scripts/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend
```
cd frontend
npm install
npm run dev
```

Configure `NEXT_PUBLIC_API_URL` in `.env.local` to point to your backend URL.
