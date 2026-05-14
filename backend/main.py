from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

from api import auth, admin, products, requests

app = FastAPI(
    title="Jwala Lakshmi Jewellers API",
    description="Backend API for the Jwala Lakshmi Jewellers private marketplace.",
    version="1.0.0"
)

# CORS configuration to allow the Next.js frontend to communicate with the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://192.168.29.179:3000",  # LAN access
    ],
    allow_origin_regex=r"http://192\.168\.\d+\.\d+:3000",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api")
app.include_router(admin.router, prefix="/api")
app.include_router(products.router, prefix="/api")
app.include_router(requests.router, prefix="/api")

@app.get("/")
def read_root():
    return {"message": "Welcome to the Jwala Lakshmi Jewellers API. Please visit /docs for API documentation."}
