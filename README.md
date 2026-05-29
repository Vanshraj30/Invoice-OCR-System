<div align="center">

# 🚀 Invoice OCR System

### Intelligent Invoice Data Extraction Platform

![Python](https://img.shields.io/badge/Python-3.x-blue?style=for-the-badge&logo=python)
![FastAPI](https://img.shields.io/badge/FastAPI-Backend-009688?style=for-the-badge&logo=fastapi)
![React](https://img.shields.io/badge/React-Frontend-61DAFB?style=for-the-badge&logo=react)
![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-UI-38B2AC?style=for-the-badge&logo=tailwind-css)
![SQLite](https://img.shields.io/badge/SQLite-Database-003B57?style=for-the-badge&logo=sqlite)

AI-powered OCR platform for extracting structured invoice data from unstructured invoice documents.

Built during **Software Internship at BHEL**.

</div>

---

# 📌 Overview

Invoice processing is often **manual, repetitive, and error-prone**, especially when handling invoices from multiple vendors with varying layouts.

This project automates the workflow using:

✅ OCR-based text extraction  
✅ Intelligent field detection  
✅ API-driven backend processing  
✅ Interactive frontend visualization

The system converts invoice images into **structured, machine-readable data**.

---

# ✨ Features

## 🔍 OCR Text Extraction

Extract textual information from invoice images using OCR processing.

## 🧠 Intelligent Invoice Parsing

Automatically extracts:

- Invoice Number
- Vendor / Supplier Name
- Invoice Date
- Product Information
- Quantity
- Tax Values
- Total Amount

## ⚡ FastAPI Backend

High-performance REST API architecture for invoice processing and data extraction.

## 🎨 Modern Frontend UI

Responsive frontend built with **React + Tailwind CSS**.

## 🧩 Multi-Layout Invoice Handling

Designed to process invoices from different vendors and layouts.

---

# 🏗 System Architecture

```txt
User Upload
    ↓
OCR Processing
    ↓
Field Detection Logic
    ↓
Structured Data Extraction
    ↓
FastAPI Backend
    ↓
React Frontend Display
```

---

# 🛠 Tech Stack

| Category | Technologies |
|----------|--------------|
| Frontend | React.js, Vite, Tailwind CSS |
| Backend | FastAPI, Python |
| OCR | Tesseract OCR |
| Database | SQLite |
| Version Control | Git, GitHub |
| Development | VS Code |

---

# 📂 Project Structure

```txt
Invoice-OCR-System/
│
├── backend/
│   ├── app/
│   │   ├── routers/
│   │   ├── services/
│   │   ├── models/
│   │   ├── db/
│   │   └── main.py
│   │
│   ├── requirements.txt
│   └── uploads/
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── assets/
│   └── package.json
│
├── README.md
└── .gitignore
```

---

# ⚙️ Quick Start

## Clone Repository

```bash
git clone https://github.com/Vanshraj30/Invoice-OCR-System.git
```

---

## Backend Setup

```bash
cd backend

pip install -r requirements.txt

uvicorn app.main:app --reload
```

Backend Server:

```txt
http://127.0.0.1:8000
```

API Documentation:

```txt
http://127.0.0.1:8000/docs
```

---

## Frontend Setup

```bash
cd frontend

npm install

npm run dev
```

Frontend Server:

```txt
http://localhost:5173
```

---

# 🎯 Internship Project Context

Developed during **Software Internship at BHEL** focusing on:

- OCR Automation
- Backend API Engineering
- Intelligent Data Extraction
- Full-Stack Application Development

---

# 🚧 Future Improvements

- [ ] PDF Invoice Support
- [ ] ML-Based Dynamic Extraction
- [ ] Authentication & Dashboard
- [ ] CSV / Excel Export
- [ ] Cloud Deployment
- [ ] Confidence Score Prediction

---

<div align="center">

## 👨‍💻 Author

**Vansh Raj**

Software Engineering • OCR Systems • Full-Stack Development

GitHub:  
https://github.com/Vanshraj30

⭐ If you found this project useful, consider starring the repository.

</div>
