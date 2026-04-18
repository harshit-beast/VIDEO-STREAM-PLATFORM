 # STREAMSPHERE

A production-ready full-stack application for uploading, processing, and streaming videos with real-time sensitivity analysis, multi-tenant architecture, and role-based access control.

## 🏗️ Architecture Overview

### Tech Stack

**Backend:**
- Node.js (Latest LTS) with Express.js
- MongoDB with Mongoose ODM
- Socket.io for real-time communication
- JWT Authentication
- Multer for file uploads
- FFmpeg for video processing
- HTTP Range Requests for video streaming

**Frontend:**
- React 18 with Vite
- Context API for state management
- Tailwind CSS for styling
- Axios for HTTP requests
- Socket.io Client for real-time updates
- React Router for navigation

### Project Structure

```
video-platform/
├── backend/
│   ├── config/
│   │   └── database.js          # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js    # Authentication logic
│   │   ├── videoController.js   # Video CRUD operations
│   │   └── streamController.js  # Video streaming
│   ├── middleware/
│   │   ├── auth.js              # JWT & RBAC middleware
│   │   └── errorHandler.js      # Global error handling
│   ├── models/
│   │   ├── User.js              # User schema
│   │   └── Video.js             # Video schema
│   ├── routes/
│   │   ├── auth.js              # Auth routes
│   │   ├── videos.js            # Video routes
│   │   └── stream.js            # Streaming routes
│   ├── socket/
│   │   └── socketHandler.js     # Socket.io handlers
│   ├── utils/
│   │   ├── generateToken.js     # JWT utilities
│   │   └── videoProcessor.js    # FFmpeg processing
│   ├── uploads/                 # Uploaded video files
│   ├── processed/               # Processed video files
│   ├── server.js                # Express server
│   ├── package.json
│   └── .env.example
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── PrivateRoute.jsx # Route protection
    │   │   └── VideoPlayer.jsx  # Video player component
    │   ├── context/
    │   │   ├── AuthContext.jsx  # Auth state management
    │   │   └── SocketContext.jsx # Socket.io connection
    │   ├── pages/
    │   │   ├── Login.jsx        # Login page
    │   │   ├── Register.jsx    # Registration page
    │   │   ├── Dashboard.jsx    # Video library
    │   │   └── Upload.jsx       # Upload interface
    │   ├── utils/
    │   │   └── api.js           # Axios configuration
    │   ├── App.jsx              # Main app component
    │   ├── main.jsx             # Entry point
    │   └── index.css            # Global styles
    ├── package.json
    ├── vite.config.js
    └── tailwind.config.js
```

## 🚀 Quick Start

### Prerequisites

1. **Node.js** (v18+ LTS)
   ```bash
   node --version  # Should be v18 or higher
   ```

2. **MongoDB** (v6+)
   ```bash
   # macOS (using Homebrew)
   brew tap mongodb/brew
   brew install mongodb-community
   brew services start mongodb-community
   
   # Verify MongoDB is running
   mongosh
   ```

3. **FFmpeg**
   ```bash
   # macOS (using Homebrew)
   brew install ffmpeg
   
   # Verify installation
   ffmpeg -version
   ```

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create environment file**
   ```bash
   cp .env.example .env
   ```

4. **Configure environment variables** (edit `.env`)
   ```env
   PORT=5001
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/video-platform
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-32-chars
   JWT_EXPIRE=7d
   MAX_FILE_SIZE=500000000
   ALLOWED_VIDEO_TYPES=video/mp4,video/mpeg,video/quicktime,video/x-msvideo,video/webm
   UPLOAD_DIR=./uploads
   PROCESSED_DIR=./processed
   FRONTEND_URL=http://localhost:5173
   SOCKET_CORS_ORIGIN=http://localhost:5173
   ```

5. **Start MongoDB** (if not already running)
   ```bash
   brew services start mongodb-community
   ```

6. **Start the backend server**
   ```bash
   npm start
   # Or for development with auto-reload:
   npm run dev
   ```

   The backend will run on `http://localhost:5001`

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

   The frontend will run on `http://localhost:5173`

### Running the Application

1. **Start MongoDB** (in a separate terminal)
   ```bash
   brew services start mongodb-community
   ```

2. **Start the backend** (in a separate terminal)
   ```bash
   cd backend
   npm start
   ```

3. **Start the frontend** (in a separate terminal)
   ```bash
   cd frontend
   npm run dev
   ```

4. **Access the application**
   - Open your browser and navigate to `http://localhost:5173`
   - Register a new account or login
   - Upload videos and monitor processing progress in real-time

## 📚 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "password123",
  "role": "viewer"  // optional: "viewer" or "editor"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "...",
      "username": "johndoe",
      "email": "john@example.com",
      "role": "viewer"
    },
    "token": "jwt-token-here"
  }
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { ... },
    "token": "jwt-token-here"
  }
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>
```

### Video Endpoints

#### Upload Video
```http
POST /api/videos/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

Form Data:
- video: <file>
- title: "My Video"
- description: "Video description" (optional)
```

**Response:**
```json
{
  "success": true,
  "message": "Video uploaded successfully. Processing started.",
  "data": {
    "video": {
      "_id": "...",
      "title": "My Video",
      "status": "uploaded",
      "processingProgress": 0,
      ...
    }
  }
}
```

#### Get All Videos
```http
GET /api/videos?status=completed&classification=safe&page=1&limit=10
Authorization: Bearer <token>
```

**Query Parameters:**
- `status`: Filter by status (uploaded, processing, completed, failed)
- `classification`: Filter by classification (safe, flagged)
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `sort`: Sort order (default: -createdAt)

#### Get Single Video
```http
GET /api/videos/:id
Authorization: Bearer <token>
```

#### Get Video Status
```http
GET /api/videos/:id/status
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "processing",
    "progress": 65,
    "classification": null
  }
}
```

#### Delete Video
```http
DELETE /api/videos/:id
Authorization: Bearer <token>
```

**Note:** Only Editor and Admin roles can delete videos.

### Streaming Endpoint

#### Stream Video
```http
GET /api/stream/:id?token=<jwt-token>
```

**Note:** Token can be passed as query parameter for HTML5 video tag compatibility, or in Authorization header.

Supports HTTP Range Requests for efficient video streaming.

### WebSocket Events

#### Client → Server

**Join User Room**
```javascript
socket.emit('join-user-room', userId);
```

#### Server → Client

**Video Processing Updates**
```javascript
socket.on('video-processing', (data) => {
  // data structure:
  {
    videoId: "...",
    status: "processing", // uploaded, processing, completed, failed
    progress: 65, // 0-100
    message: "Running sensitivity analysis...",
    classification: "safe" // only when completed: "safe" or "flagged"
  }
});
```

## 🏛️ Architecture Details

### Multi-Tenant Isolation

- Each user can only access their own videos
- Database queries automatically filter by `userId`
- Socket.io rooms isolate real-time updates per user
- Admin users can access all resources across tenants

### Video Processing Pipeline

1. **Upload**: File is saved to `uploads/` directory
2. **Database Record**: Video metadata is stored in MongoDB
3. **Background Processing**: 
   - FFmpeg extracts metadata (duration, format, codec, bitrate)
   - Simulates sensitivity analysis
   - Classifies video as "safe" or "flagged"
4. **Real-Time Updates**: Socket.io emits progress to user's room
5. **Completion**: Processed video saved to `processed/` directory
6. **Status Update**: Database updated with classification and status

### Role-Based Access Control (RBAC)

- **Viewer**: Can upload, view, and stream own videos
- **Editor**: Same as Viewer + can delete own videos
- **Admin**: Full access to all videos across all users

### Security Features

- JWT tokens for authentication
- Password hashing with bcryptjs
- File type and size validation
- Authenticated streaming endpoints
- CORS configuration
- Input validation and sanitization
- Multi-tenant data isolation

### Video Streaming

- HTTP Range Request support for efficient streaming
- Supports video seeking and partial content delivery
- Token-based authentication (header or query param)
- Only streams videos after processing is complete

## 🔧 Configuration

### Environment Variables

**Backend (.env):**
- `PORT`: Server port (default: 5001)
- `NODE_ENV`: Environment (development/production)
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key for JWT tokens (min 32 chars)
- `JWT_EXPIRE`: Token expiration (default: 7d)
- `MAX_FILE_SIZE`: Maximum upload size in bytes (default: 500MB)
- `ALLOWED_VIDEO_TYPES`: Comma-separated MIME types
- `UPLOAD_DIR`: Directory for uploaded files
- `PROCESSED_DIR`: Directory for processed files
- `FRONTEND_URL`: Frontend URL for CORS
- `SOCKET_CORS_ORIGIN`: Socket.io CORS origin

**Frontend:**
- `VITE_API_URL`: Backend API URL (default: http://localhost:5001/api)
- `VITE_SOCKET_URL`: Socket.io server URL (default: http://localhost:5001)

## 🐛 Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running: `brew services list`
- Check connection string in `.env`
- Verify MongoDB is listening on default port 27017

### FFmpeg Not Found
- Verify installation: `ffmpeg -version`
- Reinstall if needed: `brew reinstall ffmpeg`
- Ensure FFmpeg is in your PATH

### Port Already in Use
- Change PORT in backend `.env`
- Update FRONTEND_URL if backend port changes
- Kill process using port: `lsof -ti:5001 | xargs kill`
- **Note**: On macOS, port 5000 is used by AirPlay Receiver. The default port has been changed to 5001 to avoid conflicts.

### CORS Issues
- Ensure FRONTEND_URL in backend `.env` matches frontend URL
- Check that both servers are running
- Verify CORS configuration in `server.js`

### Video Upload Fails
- Check file size limit (default 500MB)
- Verify file type is supported
- Check disk space availability
- Review backend logs for errors

### Socket.io Connection Issues
- Verify Socket.io server is running
- Check SOCKET_CORS_ORIGIN configuration
- Ensure user is authenticated before connecting
- Check browser console for connection errors

### Video Streaming Issues
- Ensure video processing is complete
- Verify token is valid
- Check file exists in processed directory
- Review browser network tab for range request errors

## 🚢 Production Considerations

1. **Environment Variables**: 
   - Use strong, unique JWT_SECRET
   - Set NODE_ENV=production
   - Use environment-specific MongoDB URIs

2. **File Storage**: 
   - Consider cloud storage (AWS S3, Azure Blob, Google Cloud Storage)
   - Implement CDN for video delivery
   - Set up automatic cleanup of old files

3. **Database**: 
   - Use MongoDB Atlas or managed database service
   - Set up database backups
   - Configure connection pooling

4. **Video Processing**: 
   - Consider queue system (Bull, RabbitMQ) for video processing
   - Use worker processes for parallel processing
   - Implement retry logic for failed processing

5. **Scaling**: 
   - Use process manager (PM2) for Node.js
   - Implement load balancing
   - Use Redis for session storage and caching

6. **Security**: 
   - Enable HTTPS
   - Implement rate limiting
   - Add input sanitization
   - Set up security headers
   - Regular security audits

7. **Monitoring**: 
   - Add logging (Winston, Pino)
   - Set up error tracking (Sentry)
   - Monitor performance metrics
   - Set up alerts

8. **Video Processing**: 
   - Integrate actual ML models for sensitivity analysis
   - Use cloud-based video processing services
   - Implement video transcoding for multiple formats
   - Add thumbnail generation

## 📝 Assumptions & Design Decisions

1. **Sensitivity Analysis**: Currently simulated. In production, integrate with ML models or content moderation APIs (AWS Rekognition, Google Video Intelligence, etc.)

2. **Video Processing**: Simulated processing with progress updates. In production, implement actual video transcoding, compression, and analysis.

3. **File Storage**: Local file system for development. Production should use cloud storage with CDN.

4. **Authentication**: JWT tokens stored in localStorage. For enhanced security, consider httpOnly cookies.

5. **Streaming**: Token passed as query parameter for HTML5 video compatibility. Production should use signed URLs or token-based streaming proxies.

6. **Multi-tenancy**: User-level isolation. Can be extended to organization/team-level isolation.

7. **Error Handling**: Centralized error handling with user-friendly messages. Production should include detailed logging.

## 📄 License

ISC

## 👥 Contributing

This is a production-ready template. Feel free to extend and customize for your needs.

---

**Built with ❤️ for production-ready video processing and streaming**
