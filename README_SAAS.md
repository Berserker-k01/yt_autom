# 🚀 Scripty SaaS Platform

**AI-Powered Multi-Platform Script Generation for Content Creators**

Generate viral scripts for YouTube, TikTok, and Instagram in seconds using GPT-4o.

---

## ✨ Features

### 🎯 Multi-Platform Support
- **YouTube**: Long-form storytelling (8-15 min)
- **TikTok**: Viral short-form (30-60s)
- **Instagram**: Aesthetic Reels

### 🔐 Complete SaaS Architecture
- JWT Authentication
- User registration & email verification
- Subscription management (Free/Pro/Enterprise)
- Usage tracking & limits
- Stripe payment integration

### 💳 Pricing Tiers
- **Free**: 5 scripts/month, YouTube only
- **Pro** (12 000 FCFA/mo): 100 scripts/month, all platforms
- **Enterprise** (60 000 FCFA/mo): Unlimited, API access

### 📱 Mobile Money Payment
- Support for Orange Money, MTN Mobile Money, M-Pesa, Airtel Money, and more
- Available in Senegal, Côte d'Ivoire, Cameroon, Ghana, Kenya, Nigeria
- Instant payment confirmation via Flutterwave

### 🎨 Premium UI
- Modern glassmorphism design
- Responsive layout
- Smooth animations (Framer Motion)
- Dark mode optimized

---

## 🛠️ Tech Stack

**Backend**
- Flask (Python 3.11)
- PostgreSQL (production)
- Redis (caching)
- JWT authentication
- Flutterwave Mobile Money payments

**Frontend**
- React 19
- React Router
- Axios
- Framer Motion

**AI/ML**
- GitHub Models (GPT-4o)
- OpenAI-compatible API

**DevOps**
- Docker & Docker Compose
- Nginx (reverse proxy)
- Gunicorn (WSGI server)

---

## 📦 Installation

### Prerequisites
- Docker & Docker Compose
- GitHub account (for AI token)
- Flutterwave account (for Mobile Money payments)

### Quick Start

1. **Clone the repository**
```bash
git clone <your-repo>
cd yt_autom
```

2. **Environment Setup**

Create `.env` file:
```env
# AI API
GITHUB_TOKEN=your_github_token
GITHUB_MODEL=gpt-4o

# App Security
SECRET_KEY=your_secret_key
JWT_SECRET_KEY=your_jwt_secret

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/scripty_prod

# Flutterwave (Mobile Money)
FLW_SECRET_KEY=FLWSECK_TEST_...
FLW_PUBLIC_KEY=FLWPUBK_TEST_...
FLW_WEBHOOK_HASH=your_webhook_hash

# Frontend
FRONTEND_URL=http://localhost:3000
```

3. **Launch with Docker**
```bash
docker-compose up --build
```

4. **Access the App**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- PostgreSQL: localhost:5432
- Redis: localhost:6379

---

## 📁 Project Structure

```
yt_autom/
├── backend/
│   ├── app_saas.py          # Main Flask app
│   ├── database.py          # DB config
│   ├── saas_models.py       # SQLAlchemy models
│   ├── auth_routes.py       # Auth endpoints
│   ├── scripts_routes.py    # Scripts CRUD
│   ├── mobile_money_routes.py  # Mobile Money payments & webhooks
│   ├── auth_utils.py        # JWT utilities
│   └── requirements.txt
├── youtube-script-interface/
│   └── src/
│       ├── pages/
│       │   ├── Landing.jsx  # Marketing page
│       │   ├── Login.jsx
│       │   ├── Register.jsx
│       │   └── ...
│       ├── components/
│       │   └── ProtectedRoute.jsx
│       ├── utils/
│       │   └── auth.js      # Auth helpers
│       ├── AppRouter.jsx    # Routing config
│       └── Scripty.css      # Styles
├── main.py                  # AI generation logic
├── github_models_function.py
├── docker-compose.yml
└── README.md
```

---

## 🔌 API Endpoints

### Authentication
```
POST   /api/auth/register       # Create account
POST   /api/auth/login          # Sign in
GET    /api/auth/verify/:token  # Email verification
POST   /api/auth/refresh        # Refresh token
GET    /api/auth/me             # Current user
POST   /api/auth/logout         # Sign out
```

### Scripts
```
GET    /api/scripts             # List all scripts
POST   /api/scripts             # Generate new script
GET    /api/scripts/:id         # Get specific script
PUT    /api/scripts/:id         # Update script
DELETE /api/scripts/:id         # Delete script
GET    /api/scripts/usage       # Usage stats
```

### Mobile Money Payments
```
POST   /api/payment/initiate        # Initiate Mobile Money payment
GET    /api/payment/verify/:ref      # Verify payment status
GET    /api/payment/providers       # Get available providers by country
GET    /api/payment/history         # Get payment history
POST   /api/payment/webhook         # Flutterwave webhooks
```

---

## 🗄️ Database Schema

**users**
- id, email, password_hash, name, email_verified
- stripe_customer_id, created_at

**subscriptions**
- id, user_id, plan_type, status
- stripe_subscription_id, current_period_end

**scripts**
- id, user_id, platform, title, content
- metadata (JSON), created_at, updated_at

**social_accounts**
- id, user_id, platform, access_token
- account_name, connected_at

**usage_metrics**
- id, user_id, action_type, metadata
- timestamp

---

## 🚀 Deployment

### Production Checklist

1. **Environment Variables**
   - Set all production keys in `.env`
   - Update `FRONTEND_URL` to your domain
   - Configure `DATABASE_URL` for production DB

2. **Database Migration**
   ```bash
   # Auto-migration on app start
   # Or manually:
   flask db upgrade
   ```

3. **Flutterwave Setup**
   - Create account at https://flutterwave.com
   - Get your API keys (Secret Key and Public Key)
   - Configure webhook endpoint: `https://yourdomain.com/api/payment/webhook`
   - Set webhook hash in environment variables
   - Test in Flutterwave test mode first

4. **Deploy**
   - **Backend**: Railway, Render, or AWS
   - **Frontend**: Vercel, Netlify, or Cloudflare Pages
   - **Database**: Render PostgreSQL, Supabase, or AWS RDS

5. **Domain & SSL**
   - Configure custom domain
   - Enable HTTPS (automatic on most platforms)
   - Update CORS settings

---

## 🧪 Development

### Local Development (without Docker)

**Backend**:
```bash
cd backend
pip install -r requirements.txt
python app_saas.py
```

**Frontend**:
```bash
cd youtube-script-interface
npm install
npm start
```

### Testing
```bash
# Backend tests
pytest backend/tests/

# Frontend tests
npm test
```

---

## 📊 Usage Limits

| Plan       | Scripts/Month | Platforms | Price        |
|------------|---------------|-----------|--------------|
| Free       | 5             | YouTube   | 0 FCFA       |
| Pro        | 100           | All       | 12 000 FCFA/mo |
| Enterprise | Unlimited     | All       | 60 000 FCFA/mo |

---

## 🔒 Security

- JWT tokens (1h access, 7d refresh)
- Password hashing with bcrypt
- CORS configured
- Rate limiting (Flask-Limiter)
- SQL injection protection (SQLAlchemy)
- XSS prevention (React)
- Webhook signature verification (Flutterwave)

---

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repo
2. Create a feature branch
3. Commit your changes
4. Push and create a PR

---

## 📄 License

MIT License - see LICENSE file

---

## 💬 Support

- Email: support@scripty.app
- Discord: [Join our community](#)
- Docs: [docs.scripty.app](#)

---

**Built with ❤️ for content creators**
