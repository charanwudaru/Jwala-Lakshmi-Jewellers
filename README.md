# Jwala Lakshmi Jewellers - Private Marketplace

A full-stack web application for managing jewelry products and requests in a private marketplace. Built with **FastAPI** (Python) backend and **Next.js** (TypeScript) frontend.

---

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Project Structure](#project-structure)
- [Installation & Setup](#installation--setup)
- [Running the Application](#running-the-application)
- [Environment Variables](#environment-variables)
- [Database Management](#database-management)
- [API Documentation](#api-documentation)
- [Features Overview](#features-overview)

---

## ✨ Features

- 🔐 **User Authentication** - JWT-based login/signup with role-based access
- 💎 **Product Management** - View, create, and manage jewelry products
- 📸 **Image Upload** - Cloud-based image storage using Cloudinary
- 📝 **Request System** - Submit and manage jewelry requests
- 👤 **Admin Panel** - Administrative dashboard for managing products and users
- 📱 **Responsive Design** - Fully responsive UI with Tailwind CSS
- 🔄 **Real-time Updates** - Modern React with Next.js App Router
- 🛡️ **Security** - Password hashing, JWT tokens, CORS protection

---

## 🛠 Tech Stack

### Backend
- **Framework**: FastAPI (Python)
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Authentication**: JWT (python-jose)
- **Image Storage**: Cloudinary
- **Database Migration**: Alembic
- **Server**: Uvicorn

### Frontend
- **Framework**: Next.js 16 (React 19)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Lucide React Icons
- **Package Manager**: npm

---

## 📦 Prerequisites

Ensure you have the following installed:

- **Python 3.10+** - Download from [python.org](https://www.python.org/)
- **Node.js 18+** - Download from [nodejs.org](https://nodejs.org/)
- **PostgreSQL 13+** - Download from [postgresql.org](https://www.postgresql.org/)
- **Git** - Download from [git-scm.com](https://git-scm.com/)

### Verify Installation
```bash
python --version
node --version
npm --version
psql --version
```

---

## 📁 Project Structure

```
gold/
├── backend/                      # FastAPI backend
│   ├── alembic/                  # Database migrations
│   ├── api/                      # API routes (auth, admin, products, requests)
│   ├── core/                     # Configuration and security
│   ├── db/                       # Database models
│   ├── schemas/                  # Pydantic schemas
│   ├── services/                 # External services (Cloudinary)
│   ├── main.py                   # FastAPI app entry point
│   ├── create_db.py              # Database creation script
│   ├── seed_admin.py             # Admin user seed script
│   ├── .env                      # Environment variables
│   └── requirements.txt           # Python dependencies
│
├── jewelbridge/                  # Next.js frontend
│   ├── app/                      # Next.js app (pages, components)
│   ├── components/               # Reusable React components
│   ├── public/                   # Static files
│   ├── package.json              # Node dependencies
│   ├── tsconfig.json             # TypeScript config
│   ├── tailwind.config.mjs        # Tailwind CSS config
│   └── next.config.ts            # Next.js configuration
│
└── README.md                      # This file
```

---

## 🚀 Installation & Setup

### Step 1: Clone the Repository

```bash
git clone https://github.com/charanwudaru/Jwala-Lakshmi-Jewellers.git
cd gold
```

### Step 2: Backend Setup

#### Create Virtual Environment
```bash
cd backend

# On Windows
python -m venv venv
venv\Scripts\activate

# On macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

#### Install Dependencies
```bash
pip install -r requirements.txt
```

#### Setup Environment Variables
Create a `.env` file in the `backend/` directory:

```env
# Database Configuration
DATABASE_URL=postgresql+asyncpg://postgres:your_password@localhost:5432/jewelbridge

# JWT Configuration
SECRET_KEY=your-super-secret-jwt-key-change-me-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Cloudinary Configuration (get from cloudinary.com)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

#### Create Database
```bash
# From the backend directory
python create_db.py
```

#### Run Database Migrations
```bash
alembic upgrade head
```

#### Seed Admin User (Optional)
```bash
python seed_admin.py
# Default credentials: admin@jewellers.com / password
```

### Step 3: Frontend Setup

```bash
cd ../jewelbridge

# Install dependencies
npm install

# Create .env.local file (if needed)
# No environment variables required for basic setup
```

---

## ▶️ Running the Application

### Option 1: Run Backend & Frontend Separately (Recommended for Development)

#### Terminal 1 - Start Backend (FastAPI)
```bash
cd backend

# Activate virtual environment (if not already activated)
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

# Run the server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The backend will be available at: **http://localhost:8000**
- API Documentation: http://localhost:8000/docs

#### Terminal 2 - Start Frontend (Next.js)
```bash
cd jewelbridge

# Run the development server
npm run dev
```

The frontend will be available at: **http://localhost:3000**

### Option 2: Quick Start Script (Windows)

Create a `start.bat` file in the root directory:

```batch
@echo off
start cmd /k "cd backend && venv\Scripts\activate && uvicorn main:app --reload --host 0.0.0.0 --port 8000"
start cmd /k "cd jewelbridge && npm run dev"
```

Then run:
```bash
start.bat
```

### Production Build

#### Build Frontend
```bash
cd jewelbridge
npm run build
npm start
```

---

## 🔐 Environment Variables

### Backend (.env)
| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql+asyncpg://user:pass@localhost:5432/jewelbridge` |
| `SECRET_KEY` | JWT secret key | `your-secret-key-min-32-chars` |
| `ALGORITHM` | JWT algorithm | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token expiration time | `1440` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | From cloudinary dashboard |
| `CLOUDINARY_API_KEY` | Cloudinary API key | From cloudinary dashboard |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | From cloudinary dashboard |

---

## 🗄️ Database Management

### Create Database Tables
```bash
cd backend
python create_db.py
```

### Run Migrations
```bash
# Apply all pending migrations
alembic upgrade head

# Rollback last migration
alembic downgrade -1

# Create new migration
alembic revision --autogenerate -m "description of changes"
```

### Seed Admin User
```bash
python seed_admin.py
```

### Access PostgreSQL CLI
```bash
psql -U postgres -d jewelbridge

# List tables
\dt

# Describe a table
\d users

# Exit
\q
```

---

## 📚 API Documentation

Once the backend is running, access the interactive API documentation:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Main API Endpoints

#### Authentication
- `POST /api/login` - Login user
- `POST /api/register` - Register new user
- `POST /api/refresh` - Refresh JWT token

#### Products
- `GET /api/products` - Get all products
- `GET /api/products/{id}` - Get product details
- `POST /api/products` - Create product (admin only)
- `PUT /api/products/{id}` - Update product (admin only)
- `DELETE /api/products/{id}` - Delete product (admin only)

#### Requests
- `GET /api/requests` - Get all requests
- `POST /api/requests` - Create request
- `PUT /api/requests/{id}` - Update request status (admin only)

#### Admin
- `GET /api/admin/users` - Get all users (admin only)
- `PUT /api/admin/users/{id}` - Update user (admin only)
- `DELETE /api/admin/users/{id}` - Delete user (admin only)

---

## 🎨 Frontend Features

### Pages
- **Home** - Landing page with product showcase
- **Products** - Browse all jewelry products
- **Login** - User authentication
- **Profile** - User profile management
- **Admin** - Administrative dashboard
- **Requests** - Manage jewelry requests
- **Post** - Create new product requests

### Components
- `ProductCard` - Display product information
- `FilterModal` - Filter products
- `RequestModal` - Create/edit requests
- `Sidebar` - Navigation sidebar
- `Topbar` - Header with user menu

---

## 🔧 Troubleshooting

### Backend Issues

#### "ModuleNotFoundError" when running backend
```bash
# Ensure virtual environment is activated and dependencies installed
python -m pip install --upgrade pip
pip install -r requirements.txt
```

#### "psycopg2" connection error
```bash
# Install PostgreSQL dev libraries
# Windows: Download PostgreSQL installer with development libraries
# macOS: brew install postgresql
# Linux: sudo apt-get install postgresql postgresql-contrib
```

#### Port already in use
```bash
# Change port in uvicorn command
uvicorn main:app --reload --port 8001
```

### Frontend Issues

#### "npm install" fails
```bash
# Clear npm cache
npm cache clean --force
npm install
```

#### Port 3000 already in use
```bash
# Run on different port
npm run dev -- -p 3001
```

---

## 📝 Git Commands

### Push Changes to GitHub
```bash
# Stage all changes
git add .

# Commit changes
git commit -m "Your commit message"

# Push to main branch
git push origin main
```

### Check Status
```bash
# View modified files
git status

# View commit history
git log --oneline

# View changes
git diff
```

---

## 🤝 Contributing

1. Create a new branch for your feature: `git checkout -b feature/your-feature`
2. Make your changes and commit: `git commit -m "Add your feature"`
3. Push to branch: `git push origin feature/your-feature`
4. Open a pull request

---

## 📄 License

This project is private and not licensed for public use.

---

## 📧 Contact

For support or inquiries, contact the development team.

---

## 🚀 Deployment Notes

### Prerequisites for Production
- Use strong `SECRET_KEY` (minimum 32 characters)
- Set `DATABASE_URL` to production PostgreSQL
- Configure CORS origins for your domain
- Use HTTPS/SSL certificates
- Set up environment variables securely
- Use production-grade database backups

### Deployment Platforms
- **Backend**: Heroku, Railway, Render, AWS, Azure
- **Frontend**: Vercel, Netlify, AWS Amplify, GitHub Pages

---

**Last Updated**: May 14, 2026
