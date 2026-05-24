# Deployment Guide (Vercel & Render)

This guide explains how to deploy the PFE application to production.

## 1. Prerequisites
- A GitHub repository with your source code.
- A **Render** account (for Backend).
- A **Vercel** account (for Frontend).
- Access to your **Aiven MySQL** database.

## 2. Backend Deployment (Render)

Render is recommended for the backend because it supports Docker, which is necessary to run both Node.js and the Python microservice (with OCR).

### Steps:
1. Create a **New Web Service** on Render.
2. Connect your GitHub repository.
3. Choose **Docker** as the environment.
4. Set the following **Environment Variables**:
   - `PORT`: `7000`
   - `DB_HOST`: Your Aiven Host
   - `DB_PORT`: `26496`
   - `DB_USER`: `avnadmin`
   - `DB_PASS`: Your Aiven Password
   - `DB_NAME`: `defaultdb`
   - `DB_SSL`: `true`
   - `GROQ_API_KEY`: Your Groq Key
   - `JWT_SECRET`: A secure random string
   - `PYTHON_PATH`: `python3`

### Dockerfile (Root):
Create a `Dockerfile` at the root of your project:

```dockerfile
# Use Node.js as base
FROM node:18-slim

# Install Python and OCR dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    tesseract-ocr \
    libtesseract-dev \
    poppler-utils \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy all files
COPY . .

# Install Node dependencies
WORKDIR /app/backend
RUN npm install

# Install Python dependencies
WORKDIR /app/microservice-python
RUN pip3 install --no-cache-dir -r requirements.txt

# Final workdir
WORKDIR /app/backend

# Expose port
EXPOSE 7000

# Start command
CMD ["npm", "start"]
```

## 3. Frontend Deployment (Vercel)

1. Create a **New Project** on Vercel.
2. Select your repository and the `frontend` folder.
3. Set the following **Environment Variable**:
   - `VITE_API_URL`: Your Render backend URL (e.g., `https://your-service.onrender.com`)
4. Deploy!

## 4. Database Setup
Ensure you have synchronized your Aiven database schema by running `node sync_db.js` once from your local machine pointing to Aiven, or by letting the backend sync on start.
