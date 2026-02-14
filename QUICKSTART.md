# 🚀 Quick Start Guide

## 5-Minute Setup

### Step 1: Install Dependencies

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd frontend
npm install
```

### Step 2: Start MongoDB

Make sure MongoDB is running on your system:

**Windows:**
```bash
# If MongoDB is installed as a service, it should start automatically
# Or run: mongod
```

**Mac/Linux:**
```bash
sudo systemctl start mongod
# Or: brew services start mongodb-community
```

### Step 3: Configure Environment

**Backend:** Create `backend/.env`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/gamified-learning
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

**Frontend:** (Optional) Create `frontend/.env`:
```env
REACT_APP_API_URL=http://localhost:5000/api
```

### Step 4: Seed Demo Data

```bash
cd backend
npm run seed
```

This creates:
- 1 teacher account
- 5 student accounts
- 2 demo quizzes with questions

### Step 5: Start Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

### Step 6: Access Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Demo Credentials

### Teacher Login
- **Email:** `teacher@demo.com`
- **Password:** `teacher123`

### Student Logins
- **Alice:** `alice@demo.com` / `student123` (Level 5, High Scorer)
- **Bob:** `bob@demo.com` / `student123` (Level 3)
- **Charlie:** `charlie@demo.com` / `student123` (Level 2)
- **Diana:** `diana@demo.com` / `student123` (Level 4)
- **Eve:** `eve@demo.com` / `student123` (Level 1)

## Quick Demo Flow

### For Judges (5-minute walkthrough):

1. **Login as Student** (30s)
   - Use `alice@demo.com` / `student123`
   - Show dashboard with level, points, badges

2. **Take a Quiz** (2min)
   - Browse quizzes
   - Start "JavaScript Fundamentals"
   - Answer questions (show timer, progress bar)
   - Submit quiz

3. **View Results** (1min)
   - Show personalized feedback
   - Explain strengths/weaknesses
   - Show question review

4. **Check Leaderboard** (30s)
   - Show global leaderboard
   - Explain scoring system

5. **Teacher Dashboard** (1min)
   - Login as teacher
   - Show analytics dashboard
   - Explain engagement metrics
   - Show drop-out risk indicators

## Troubleshooting

### MongoDB Connection Error
```bash
# Check if MongoDB is running
# Windows: Check Services
# Mac/Linux: sudo systemctl status mongod
```

### Port Already in Use
```bash
# Change PORT in backend/.env
# Or kill process using port 5000/3000
```

### Module Not Found
```bash
# Delete node_modules and reinstall
rm -rf node_modules
npm install
```

### CORS Errors
- Make sure backend is running on port 5000
- Check REACT_APP_API_URL in frontend/.env

## Production Build

**Frontend:**
```bash
cd frontend
npm run build
# Serve the build folder
```

**Backend:**
```bash
cd backend
NODE_ENV=production npm start
```

## Need Help?

Check the main README.md for detailed documentation!

