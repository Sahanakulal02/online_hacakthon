# System Architecture Documentation

## Overview

The Gamified Learning Platform follows a **3-tier architecture**:
1. **Presentation Layer** (React Frontend)
2. **Application Layer** (Express Backend)
3. **Data Layer** (MongoDB)

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Student    │  │   Teacher    │  │   Public     │  │
│  │   Interface  │  │   Interface  │  │   Leaderboard│  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
└─────────┼─────────────────┼─────────────────┼──────────┘
          │                 │                 │
          └─────────────────┴─────────────────┘
                            │
                    HTTP/REST API
                            │
┌───────────────────────────▼───────────────────────────────┐
│                  APPLICATION LAYER                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Auth       │  │   Quiz       │  │   Analytics  │  │
│  │   Routes     │  │   Routes     │  │   Routes     │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
│         │                 │                 │           │
│  ┌──────▼─────────────────▼─────────────────▼───────┐  │
│  │         Business Logic Layer                      │  │
│  │  • Adaptive Difficulty Engine                     │  │
│  │  • Personalized Feedback Generator                │  │
│  │  • Score Calculation                             │  │
│  │  • Engagement Metrics                            │  │
│  └───────────────────────────────────────────────────┘  │
│         │                 │                 │           │
│  ┌──────▼─────────────────▼─────────────────▼───────┐  │
│  │         Middleware Layer                         │  │
│  │  • JWT Authentication                           │  │
│  │  • Role-based Authorization                     │  │
│  │  • Input Validation                            │  │
│  └───────────────────────────────────────────────────┘  │
└───────────────────────────┬───────────────────────────────┘
                            │
                    MongoDB Driver
                            │
┌───────────────────────────▼───────────────────────────────┐
│                    DATA LAYER                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Users      │  │   Quizzes    │  │   Attempts   │  │
│  │   Collection │  │   Collection │  │   Collection │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└──────────────────────────────────────────────────────────┘
```

## Data Flow

### Student Quiz Flow

```
1. Student selects quiz
   ↓
2. Frontend requests quiz data (GET /api/quiz/:id)
   ↓
3. Backend returns quiz (without answers)
   ↓
4. Student answers questions
   ↓
5. Frontend sends attempt (POST /api/student/quiz/:id/attempt)
   ↓
6. Backend processes:
   - Calculates scores
   - Applies adaptive difficulty
   - Generates feedback
   - Updates student stats
   ↓
7. Backend returns attempt with feedback
   ↓
8. Frontend displays results
```

### Teacher Analytics Flow

```
1. Teacher views dashboard
   ↓
2. Frontend requests analytics (GET /api/analytics/dashboard)
   ↓
3. Backend aggregates data:
   - Quiz completion rates
   - Student engagement scores
   - Topic-wise performance
   - Drop-out risk indicators
   ↓
4. Backend returns JSON data
   ↓
5. Frontend renders charts and tables
```

## Database Schema

### User Collection
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (hashed),
  role: 'student' | 'teacher',
  level: Number,           // Student only
  totalPoints: Number,     // Student only
  badges: [String],       // Student only
  totalQuizzesAttempted: Number,
  averageAccuracy: Number,
  createdAt: Date
}
```

### Quiz Collection
```javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  createdBy: ObjectId (ref: User),
  questions: [{
    questionText: String,
    options: [String],
    correctAnswer: Number,
    difficulty: 'easy' | 'medium' | 'hard',
    topic: String,
    points: Number,
    timeLimit: Number
  }],
  isActive: Boolean,
  difficulty: String,
  totalPoints: Number,
  createdAt: Date
}
```

### Attempt Collection
```javascript
{
  _id: ObjectId,
  studentId: ObjectId (ref: User),
  quizId: ObjectId (ref: Quiz),
  answers: [{
    questionId: ObjectId,
    selectedAnswer: Number,
    isCorrect: Boolean,
    timeTaken: Number,
    difficulty: String,
    pointsEarned: Number
  }],
  totalScore: Number,
  totalPoints: Number,
  accuracy: Number,
  timeSpent: Number,
  averageTimePerQuestion: Number,
  difficultyProgression: [String],
  feedback: {
    strengths: [String],
    weaknesses: [String],
    suggestions: [String],
    personalizedMessage: String
  },
  completedAt: Date
}
```

## API Design Patterns

### RESTful Conventions
- `GET /api/resource` - List all
- `GET /api/resource/:id` - Get one
- `POST /api/resource` - Create
- `PUT /api/resource/:id` - Update
- `DELETE /api/resource/:id` - Delete

### Authentication
- JWT tokens in `Authorization: Bearer <token>` header
- Tokens expire after 7 days
- Protected routes require valid token

### Error Handling
```javascript
{
  message: "Error description",
  errors: [...] // Validation errors
}
```

## Security Measures

1. **Password Hashing** - bcrypt with salt rounds
2. **JWT Tokens** - Secure token-based auth
3. **Role-based Access** - Student/Teacher separation
4. **Input Validation** - express-validator
5. **CORS** - Configured for frontend origin
6. **No SQL Injection** - Mongoose ODM protection

## Performance Optimizations

1. **Database Indexing** - Email, userId, quizId
2. **Aggregation Pipelines** - Efficient leaderboard queries
3. **Lazy Loading** - Frontend code splitting
4. **Caching** - Consider Redis for production
5. **Pagination** - Limit results (e.g., top 100)

## Scalability Considerations

### Horizontal Scaling
- Stateless API design
- Load balancer for multiple instances
- Shared MongoDB cluster

### Vertical Scaling
- Database connection pooling
- Query optimization
- CDN for static assets

## Deployment Architecture

```
┌─────────────┐
│   CDN       │  (Static assets)
└─────────────┘
       │
┌──────▼──────┐
│  Load       │
│  Balancer   │
└──────┬──────┘
       │
┌──────▼──────┐  ┌──────────────┐
│  Backend    │  │  Backend     │
│  Instance 1 │  │  Instance 2  │
└──────┬──────┘  └──────┬───────┘
       │                │
       └────────┬────────┘
                │
        ┌───────▼────────┐
        │   MongoDB      │
        │   Replica Set │
        └───────────────┘
```

## Technology Choices Rationale

### Backend: Node.js + Express
- **Fast development** - JavaScript everywhere
- **Rich ecosystem** - NPM packages
- **Async I/O** - Perfect for I/O-heavy operations
- **JSON native** - Easy API responses

### Database: MongoDB
- **Flexible schema** - Easy to iterate
- **JSON-like documents** - Natural fit for JavaScript
- **Aggregation framework** - Powerful analytics
- **Horizontal scaling** - Sharding support

### Frontend: React
- **Component reusability** - DRY principle
- **Virtual DOM** - Performance
- **Rich ecosystem** - Libraries and tools
- **Developer experience** - Hot reload, dev tools

## Future Architecture Enhancements

1. **Microservices** - Split into services (auth, quiz, analytics)
2. **Message Queue** - RabbitMQ/Kafka for async processing
3. **Caching Layer** - Redis for frequently accessed data
4. **Search Engine** - Elasticsearch for quiz search
5. **Real-time** - WebSockets for live updates
6. **CDN** - CloudFront/Cloudflare for static assets

