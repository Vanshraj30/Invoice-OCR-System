from sqlalchemy import Column, Integer, String, Float, DateTime
from datetime import datetime
from app.db.database import Base
from sqlalchemy import JSON


class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String)
    invoice_number = Column(String)
    date = Column(String)
    total = Column(Float)
    vendor_name    = Column(String, nullable=True)  # ← ADD THIS
    status         = Column(String, default="draft") # ← ADD THIS
    created_at = Column(DateTime, default=datetime.utcnow)
    email = Column(String, nullable=True)

    phone = Column(String, nullable=True)

    payment_mode = Column(String, nullable=True)

    po_number = Column(String, nullable=True)

    quantity = Column(String, nullable=True)

    address = Column(String, nullable=True)

    ml_analysis = Column(JSON, nullable=True)
    ml_prediction = Column(JSON, nullable=True)
    aiesi_analysis = Column(JSON, nullable=True)