"""
Script to create an unlimited demo account for Scripty SaaS.
Usage: docker exec scripty_backend python -m backend.create_demo_user
"""
import sys
import os
from datetime import datetime, timedelta

# Add the project root to sys.path to allow imports from backend
sys.path.append(os.getcwd())

from backend.app_saas import app
from backend.database import db
from backend.saas_models import User, Subscription

def create_demo_user():
    with app.app_context():
        email = "demo@scripty.com"
        password = "DemoPassword123!"
        name = "Directeur Démo"

        # Check if user already exists
        user = User.query.filter_by(email=email).first()
        if user:
            print(f"User {email} already exists. Updating subscription...")
        else:
            print(f"Creating demo user {email}...")
            user = User(
                email=email,
                name=name,
                is_admin=True,
                email_verified=True
            )
            user.set_password(password)
            db.session.add(user)
            db.session.flush()

        # Update/Create subscription
        if not user.subscription:
            subscription = Subscription(
                user_id=user.id,
                plan_type="enterprise",
                status="active",
                current_period_end=datetime.utcnow() + timedelta(days=3650)  # 10 years
            )
            db.session.add(subscription)
        else:
            user.subscription.plan_type = "enterprise"
            user.subscription.status = "active"
            user.subscription.current_period_end = datetime.utcnow() + timedelta(days=3650)

        db.session.commit()
        print(f"✅ Demo account ready!")
        print(f"📧 Email: {email}")
        print(f"🔑 Password: {password}")
        print(f"🚀 Plan: Enterprise (Unlimited)")

if __name__ == "__main__":
    create_demo_user()
