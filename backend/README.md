# Projectify Backend

A complete Node.js backend for the Projectify application with authentication, project management, and email notifications.

## Features

- **Authentication**: JWT-based authentication with role-based access control
- **Project Management**: CRUD operations for projects with approval workflow
- **Application System**: Users can apply to projects with status tracking
- **Email Notifications**: Automated emails for registrations, approvals, and rejections
- **Analytics**: Dashboard statistics and reporting for admins
- **Security**: Rate limiting, input validation, and secure password hashing

## Tech Stack

- **Backend**: Node.js + Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT tokens with bcrypt password hashing
- **Email**: Nodemailer with Gmail SMTP
- **Validation**: Joi for request validation
- **Security**: Helmet, CORS, Rate limiting

## Installation

1. Clone the repository and navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file with the following variables:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/projectify
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-app-password
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

4. Start MongoDB service on your system

5. Run the development server:
```bash
npm run dev
```

## API Endpoints

### Authentication Routes
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user info

### Projects Routes
- `GET /api/projects` - Get projects (filtered by role)
- `POST /api/projects` - Create new project (Admin only)
- `PUT /api/projects/:id/approve` - Approve project (Admin only)
- `PUT /api/projects/:id/reject` - Reject project (Admin only)
- `GET /api/projects/:id` - Get single project
- `DELETE /api/projects/:id` - Delete project (Admin only)

### Applications Routes
- `POST /api/applications` - Apply to project
- `GET /api/applications/my` - Get user's applications
- `GET /api/applications` - Get all applications (Admin only)
- `PUT /api/applications/:id/approve` - Approve application (Admin only)
- `PUT /api/applications/:id/reject` - Reject application (Admin only)

### Analytics Routes (Admin only)
- `GET /api/analytics/dashboard` - Get dashboard statistics
- `GET /api/analytics/projects-by-status` - Get project counts by status
- `GET /api/analytics/applications-by-status` - Get application counts by status
- `GET /api/analytics/recent-activity` - Get recent activity

## Database Schema

### Users Collection
```javascript
{
  name: String (required),
  email: String (required, unique),
  password: String (required, hashed),
  role: String (enum: ['admin', 'user'], default: 'user'),
  createdAt: Date,
  updatedAt: Date
}
```

### Projects Collection
```javascript
{
  name: String (required),
  description: String (required),
  startDate: Date (required),
  endDate: Date (required),
  budget: Number (required),
  status: String (enum: ['pending', 'approved', 'rejected'], default: 'pending'),
  createdBy: ObjectId (reference to admin user),
  createdAt: Date,
  updatedAt: Date
}
```

### Applications Collection
```javascript
{
  projectId: ObjectId (reference to project),
  userId: ObjectId (reference to user),
  userName: String,
  userEmail: String,
  projectName: String,
  status: String (enum: ['pending', 'approved', 'rejected'], default: 'pending'),
  appliedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

## Email Templates

The system includes automated email notifications for:
- Welcome emails on user registration
- Project approval notifications
- Application approval/rejection emails

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- Rate limiting to prevent abuse
- Input validation and sanitization
- CORS configuration
- Security headers with Helmet

## Error Handling

Comprehensive error handling with:
- Global error handler middleware
- Consistent error response format
- Validation error handling
- Database error handling
- JWT error handling

## Development

Run in development mode with auto-restart:
```bash
npm run dev
```

## Production Deployment

1. Set `NODE_ENV=production` in your environment
2. Use a process manager like PM2
3. Set up proper logging
4. Configure environment variables
5. Set up database connection pooling
6. Implement health checks

## Health Check

The server includes a health check endpoint:
```
GET /api/health
```

This endpoint returns server status and can be used for monitoring.