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

# Allow pip to install packages system-wide
ENV PIP_BREAK_SYSTEM_PACKAGES 1

# Copy all files
COPY . .

# Install Node dependencies
WORKDIR /app/backend
RUN npm install

# Install Python dependencies Autoriser l’installation de paquets Python système
WORKDIR /app/microservice-python
RUN pip3 install --no-cache-dir -r requirements.txt

# Final workdir
WORKDIR /app/backend

# Expose port
EXPOSE 7000

# Start command
CMD ["npm", "start"]
