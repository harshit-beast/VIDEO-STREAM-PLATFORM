# Quick Start Guide

Get the Video Platform up and running in 5 minutes!

## Prerequisites Check

```bash
# Check Node.js (should be v18+)
node --version

# Check MongoDB
mongosh --version

# Check FFmpeg
ffmpeg -version
```

If any are missing, install them first (see main README.md).

## Step-by-Step Setup

### 1. Backend Setup (Terminal 1)

```bash
cd backend
npm install
cp .env.example .env
# Edit .env if needed (defaults should work)
npm start
```

Backend should start on `http://localhost:5000`

### 2. Frontend Setup (Terminal 2)

```bash
cd frontend
npm install
npm run dev
```

Frontend should start on `http://localhost:5173`

### 3. Start MongoDB (Terminal 3, if not running)

```bash
brew services start mongodb-community
```

## First Steps

1. **Open** `http://localhost:5173` in your browser
2. **Register** a new account (or login if you have one)
3. **Upload** a video file (MP4, MOV, AVI, WebM - max 500MB)
4. **Watch** real-time processing progress
5. **Stream** the video once processing completes

## Testing the Application

### Test User Roles

1. **Register as Viewer**: Can upload and view videos
2. **Register as Editor**: Can upload, view, and delete videos
3. **Register as Admin**: Full access to all videos

### Test Video Processing

1. Upload a video
2. Watch the dashboard for real-time progress updates
3. Processing simulates:
   - Metadata extraction
   - Sensitivity analysis
   - Classification (safe/flagged)

### Test Streaming

1. Wait for video processing to complete
2. Click "Play" button on a completed video
3. Video should stream with full controls

## Common Issues

**Backend won't start:**
- Check MongoDB is running: `brew services list`
- Check port 5000 is available: `lsof -ti:5000`

**Frontend won't connect:**
- Verify backend is running on port 5000
- Check browser console for CORS errors
- Verify `.env` FRONTEND_URL matches frontend URL

**Video upload fails:**
- Check file size (max 500MB)
- Check file type is supported
- Check backend logs for errors

**Socket.io not connecting:**
- Verify user is logged in
- Check browser console for connection errors
- Verify SOCKET_CORS_ORIGIN in backend `.env`

## Next Steps

- Read the full [README.md](./README.md) for detailed documentation
- Explore the API endpoints
- Customize for your needs
- Deploy to production (see Production Considerations in README)

---

**Happy coding! 🚀**
