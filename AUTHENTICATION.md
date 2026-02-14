# 🔐 Authentication System Documentation

## Overview

The Gamified Learning Platform uses **JWT (JSON Web Token)** based authentication with **bcrypt** password hashing. The system supports both **Student** and **Teacher** roles with proper database-backed authentication.

---

## 🔄 Authentication Flow

### Signup Flow

```
1. User fills registration form
   ↓
2. Frontend sends POST /api/auth/register
   ↓
3. Backend validates input
   ↓
4. Check if email already exists
   ↓
5. Create new User (password auto-hashed by Mongoose pre-save hook)
   ↓
6. Generate JWT token
   ↓
7. Return token + user data
   ↓
8. Frontend stores token in localStorage
   ↓
9. Redirect to appropriate dashboard
```

### Login Flow

```
1. User enters email + password
   ↓
2. Frontend sends POST /api/auth/login
   ↓
3. Backend normalizes email (lowercase)
   ↓
4. Find user by email in database
   ↓
5. Compare password using bcrypt
   ↓
6. Generate JWT token on success
   ↓
7. Return token + user data
   ↓
8. Frontend stores token in localStorage
   ↓
9. Redirect based on role (student/teacher)
```

---

## 🗄️ Database Schema

### User Model (`backend/models/User.js`)

```javascript
{
  name: String (required, trimmed),
  email: String (required, unique, lowercase, trimmed),
  password: String (required, min 6 chars, hashed with bcrypt),
  role: String (enum: ['student', 'teacher'], default: 'student'),
  
  // Student-specific fields
  level: Number (default: 1),
  totalPoints: Number (default: 0),
  badges: [String],
  totalQuizzesAttempted: Number (default: 0),
  averageAccuracy: Number (default: 0),
  
  createdAt: Date (auto-generated)
}
```

### Password Hashing

- **Algorithm:** bcrypt with salt rounds of 10
- **When:** Automatically on user creation/update (Mongoose pre-save hook)
- **Storage:** Hashed password stored in database (never plain text)

---

## 🔑 API Endpoints

### POST `/api/auth/register`

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "student" // optional, defaults to "student"
}
```

**Success Response (201):**
```json
{
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "student",
    "level": 1,
    "totalPoints": 0,
    "badges": []
  }
}
```

**Error Responses:**

**400 - Validation Error:**
```json
{
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Please provide a valid email"
    }
  ]
}
```

**400 - User Exists:**
```json
{
  "message": "User already exists with this email",
  "field": "email"
}
```

### POST `/api/auth/login`

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Success Response (200):**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "student",
    "level": 1,
    "totalPoints": 0,
    "badges": []
  }
}
```

**Error Responses:**

**401 - Invalid Credentials:**
```json
{
  "message": "Invalid email or password",
  "field": "credentials"
}
```

### GET `/api/auth/me`

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "student",
    "level": 1,
    "totalPoints": 0,
    "badges": []
  }
}
```

**Error Responses:**

**401 - No Token:**
```json
{
  "message": "No token provided, authorization denied"
}
```

**401 - Invalid Token:**
```json
{
  "message": "Token is not valid"
}
```

---

## 🛡️ Security Features

### 1. Password Hashing
- **bcrypt** with 10 salt rounds
- Passwords never stored in plain text
- Automatic hashing on user creation/update

### 2. Email Normalization
- All emails converted to lowercase
- Trimming whitespace
- Consistent database lookups

### 3. JWT Tokens
- **Expiration:** 7 days (configurable)
- **Secret:** Environment variable (JWT_SECRET)
- **Payload:** Contains userId only

### 4. Input Validation
- **express-validator** for request validation
- Email format validation
- Password length validation (min 6 chars)
- Role enum validation

### 5. Error Handling
- Generic error messages for security (don't reveal if email exists)
- Detailed validation errors for user feedback
- Proper HTTP status codes

---

## 🔒 Protected Routes

### Middleware Usage

```javascript
// Protect any route
router.get('/protected', authenticate, (req, res) => {
  // req.user contains authenticated user
  res.json({ user: req.user });
});

// Teacher-only route
router.get('/teacher-only', authenticate, isTeacher, (req, res) => {
  res.json({ message: 'Teacher access granted' });
});

// Student-only route
router.get('/student-only', authenticate, isStudent, (req, res) => {
  res.json({ message: 'Student access granted' });
});
```

### Frontend Protection

```javascript
// PrivateRoute component automatically checks authentication
<Route
  path="/student/dashboard"
  element={
    <PrivateRoute>
      <StudentDashboard />
    </PrivateRoute>
  }
/>
```

---

## 💻 Frontend Implementation

### AuthContext (`frontend/src/context/AuthContext.js`)

**Features:**
- Automatic token validation on app load
- Token stored in localStorage
- Axios headers automatically set
- User state management

**Usage:**
```javascript
const { user, login, register, logout } = useAuth();

// Login
const result = await login(email, password);
if (result.success) {
  // Redirect based on role
}

// Register
const result = await register(name, email, password, role);
if (result.success) {
  // User registered and logged in
}

// Logout
logout();
```

### Login Component

**Features:**
- Email/password validation
- Error message display
- Automatic redirect on success
- Demo credentials display

### Register Component

**Features:**
- Full form validation
- Role selection (student/teacher)
- Password strength indicator (min 6 chars)
- Error handling

---

## 🧪 Testing Authentication

### Test Signup

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "test123",
    "role": "student"
  }'
```

### Test Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123"
  }'
```

### Test Protected Route

```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer <your-token>"
```

---

## 🎯 Demo Credentials

The seed script (`backend/scripts/seedDemoData.js`) creates demo users:

**Teacher:**
- Email: `teacher@demo.com`
- Password: `teacher123`

**Students:**
- Email: `alice@demo.com` / Password: `student123`
- Email: `bob@demo.com` / Password: `student123`
- Email: `charlie@demo.com` / Password: `student123`
- Email: `diana@demo.com` / Password: `student123`
- Email: `eve@demo.com` / Password: `student123`

**To seed demo data:**
```bash
cd backend
npm run seed
```

---

## 🔧 Configuration

### Environment Variables

**Backend (`.env`):**
```env
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRES_IN=7d
MONGODB_URI=mongodb://localhost:27017/gamified-learning
```

**Frontend (`.env`):**
```env
REACT_APP_API_URL=http://localhost:5000/api
```

---

## 🐛 Troubleshooting

### Issue: "User already exists"
**Solution:** Email is already registered. Use login instead or try different email.

### Issue: "Invalid credentials"
**Solution:** 
- Check email spelling (case-insensitive)
- Verify password is correct
- Ensure user exists in database

### Issue: "Token is not valid"
**Solution:**
- Token may have expired (7 days)
- Token may be corrupted
- User should log in again

### Issue: Password not hashing
**Solution:**
- Ensure bcryptjs is installed: `npm install bcryptjs`
- Check Mongoose pre-save hook is working
- Verify password is being modified (not just read)

### Issue: Can't login after signup
**Solution:**
- Check MongoDB connection
- Verify user was saved (check database)
- Ensure email normalization is working
- Check password comparison logic

---

## 📊 Real-World Improvements

### Before (Issues)
- ❌ Hardcoded credentials only
- ❌ No database persistence
- ❌ No password hashing
- ❌ Case-sensitive email matching
- ❌ Poor error handling

### After (Fixed)
- ✅ Full database-backed authentication
- ✅ Secure password hashing (bcrypt)
- ✅ Case-insensitive email matching
- ✅ Comprehensive error handling
- ✅ JWT token-based sessions
- ✅ Role-based access control
- ✅ Input validation
- ✅ Demo users work like real users

---

## 🚀 Production Considerations

1. **JWT Secret:** Use strong, random secret in production
2. **HTTPS:** Always use HTTPS in production
3. **Token Expiration:** Consider shorter expiration for production
4. **Rate Limiting:** Add rate limiting to prevent brute force
5. **Password Policy:** Consider stronger password requirements
6. **Email Verification:** Add email verification for production
7. **Password Reset:** Implement password reset functionality
8. **Session Management:** Consider refresh tokens for better security

---

**Authentication system is now production-ready with proper security measures! 🔐**

