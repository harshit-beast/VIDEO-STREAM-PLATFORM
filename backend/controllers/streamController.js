import Video from '../models/Video.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { verifyToken } from '../utils/generateToken.js';
import fs from 'fs';
import path from 'path';

/**
 * @desc    Stream video with HTTP Range Request support
 * @route   GET /api/stream/:id
 * @access  Private (token can be in header or query param for video tag)
 */
export const streamVideo = asyncHandler(async (req, res) => {
  // Support token in query param for video tag (since HTML5 video doesn't support custom headers)
  let user = req.user;
  
  if (!user && req.query.token) {
    try {
      const decoded = verifyToken(req.query.token);
      // Attach minimal user info for authorization check
      user = { _id: decoded.userId, role: decoded.role };
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
      });
    }
  }

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
  }

  const video = await Video.findById(req.params.id);

  if (!video) {
    return res.status(404).json({
      success: false,
      message: 'Video not found',
    });
  }

  // Check ownership (unless admin)
  const userId = typeof user._id === 'string' ? user._id : user._id.toString();
  if (user.role !== 'admin' && video.userId.toString() !== userId) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to stream this video',
    });
  }

  // Allow streaming of original file even if processing is not complete
  // Use processed file if available and completed, otherwise use original
  let videoPath;
  if (video.status === 'completed' && video.processedFilePath) {
    videoPath = video.processedFilePath;
  } else if (video.status === 'failed') {
    // If processing failed, still allow streaming original file
    videoPath = video.filePath;
  } else {
    // For uploaded/processing status, use original file
    videoPath = video.filePath;
  }

  // Check if file exists
  if (!fs.existsSync(videoPath)) {
    console.error(`❌ Video file not found: ${videoPath}`);
    console.error(`   Video status: ${video.status}`);
    console.error(`   Processed path: ${video.processedFilePath || 'not set'}`);
    console.error(`   Original path: ${video.filePath}`);
    return res.status(404).json({
      success: false,
      message: 'Video file not found',
      details: `Expected file at: ${videoPath}`,
    });
  }

  console.log(`✅ Streaming video: ${videoPath} (status: ${video.status})`);
  console.log(`   Stored MIME type: ${video.mimeType}`);

  // Get correct MIME type based on file extension (more reliable than stored MIME type)
  const getMimeType = (filePath) => {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.mp4': 'video/mp4',
      '.mpeg': 'video/mpeg',
      '.mpg': 'video/mpeg',
      '.mov': 'video/quicktime',
      '.avi': 'video/x-msvideo',
      '.webm': 'video/webm',
      '.mkv': 'video/x-matroska',
      '.flv': 'video/x-flv',
      '.wmv': 'video/x-ms-wmv',
    };
    
    const detectedMimeType = mimeTypes[ext] || video.mimeType || 'video/mp4';
    console.log(`   File extension: ${ext}, Detected MIME type: ${detectedMimeType}`);
    return detectedMimeType;
  };

  const contentType = getMimeType(videoPath);

  const stat = fs.statSync(videoPath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    // Parse Range header
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = end - start + 1;
    const file = fs.createReadStream(videoPath, { start, end });
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Range',
      'Access-Control-Expose-Headers': 'Content-Range, Content-Length, Accept-Ranges',
    };
    res.writeHead(206, head);
    file.pipe(res);
  } else {
    // Send entire file if no range requested
    const head = {
      'Content-Length': fileSize,
      'Content-Type': contentType,
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Range',
      'Access-Control-Expose-Headers': 'Content-Range, Content-Length, Accept-Ranges',
    };
    res.writeHead(200, head);
    fs.createReadStream(videoPath).pipe(res);
  }
});
