import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from app.db_models import User, UserRole
from uuid import uuid4

def create_admin():
    db = SessionLocal()
    
    # Check if admin exists
    existing_admin = db.query(User).filter(User.role == UserRole.ADMIN).first()
    
    if existing_admin:
        print("❌ Admin already exists!")
        print(f"Email: {existing_admin.email}")
        return
    
    # Get admin details
    print("=== Create Admin Account ===")
    email = "vikasanand.darkmatter@gmail.com".strip()
    full_name = "Vikas Anand".strip()
    google_id = "vikasanand.darkmatter".strip()
    
    # Create admin
    admin = User(
        id=uuid4(),
        email=email,
        full_name=full_name,
        google_id=google_id,
        role=UserRole.ADMIN,
        is_active=True
    )
    
    db.add(admin)
    db.commit()
    
    print("\n✅ Admin created successfully!")
    print(f"Email: {email}")
    print(f"Name: {full_name}")
    print(f"Role: ADMIN")
    print("\nYou can now login with Google OAuth using this email.")
    
    db.close()

if __name__ == "__main__":
    create_admin()