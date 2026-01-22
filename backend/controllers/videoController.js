import Video from '../models/Video.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { 
  getVideoMetadata, 
  analyzeSensitivity, 
  processVideo,
  validateVideoFile 
} from '../utils/videoProcessor.js';
import fs from 'fs/promises';
import path from 'path';

/**
 * @desc    Upload a video
 * @route   POST /api/videos/upload
 * @access  Private
 */
export const uploadVideo = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No video file uploaded',
    });
  }

  try {
    // Validate video file
    validateVideoFile(req.file);

    const { title, description } = req.body;

    if (!title) {
      // Clean up uploaded file if validation fails
      await fs.unlink(req.file.path);
      return res.status(400).json({
        success: false,
        message: 'Video title is required',
      });
    }

    // Get video metadata
    let metadata;
    try {
      metadata = await getVideoMetadata(req.file.path);
    } catch (error) {
      await fs.unlink(req.file.path);
      return res.status(400).json({
        success: false,
        message: 'Failed to process video file. Please ensure it is a valid video file.',
        error: error.message,
      });
    }

    // Create video record
    const video = await Video.create({
      userId: req.user._id,
      title,
      description: description || '',
      filename: req.file.filename,
      originalFilename: req.file.originalname,
      filePath: req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      duration: metadata.duration,
      status: 'uploaded',
      processingProgress: 0,
      metadata: {
        width: metadata.width,
        height: metadata.height,
        codec: metadata.codec,
        bitrate: metadata.bitrate,
      },
    });

    // Start background processing (non-blocking)
    // Get Socket.io instance from app
    const io = req.app ? req.app.get('io') : null;
    if (!io) {
      console.warn('⚠️ Socket.io instance not found. Video processing updates will not be sent.');
    } else {
      console.log('✅ Socket.io instance found, real-time updates will be sent');
    }
    processVideoInBackground(video._id.toString(), io);

    res.status(201).json({
      success: true,
      message: 'Video uploaded successfully. Processing started.',
      data: {
        video,
      },
    });
  } catch (error) {
    // Clean up uploaded file on error
    if (req.file && req.file.path) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error cleaning up file:', unlinkError);
      }
    }

    throw error;
  }
});

/**
 * Background video processing function
 * Processes video and emits real-time updates via Socket.io
 */
const processVideoInBackground = async (videoId, io) => {
  try {
    const video = await Video.findById(videoId);
    if (!video) {
      console.error(`Video ${videoId} not found`);
      return;
    }

    // Check if io is available
    if (!io) {
      console.error('Socket.io instance not available. Processing will continue without real-time updates.');
    }

    // Update status to processing
    video.status = 'processing';
    video.processingProgress = 0;
    await video.save();

    // Emit initial processing status (only if io is available)
    if (io) {
      const userId = video.userId?.toString() || video.userId;
      const userRoom = `user-${userId}`;
      console.log(`📤 Emitting to room: ${userRoom}`);
      io.to(userRoom).emit('video-processing', {
        videoId: video._id.toString(),
        status: 'processing',
        progress: 0,
        message: 'Processing started...',
      });
    }

    // Process video with progress updates
    const processedDir = process.env.PROCESSED_DIR || './processed';
    const processedFilename = `processed-${video.filename}`;
    const processedPath = path.join(processedDir, processedFilename);

    // Ensure processed directory exists
    await fs.mkdir(processedDir, { recursive: true });

    console.log(`🔄 Starting video processing for ${videoId}`);
    console.log(`   Input: ${video.filePath}`);
    console.log(`   Output: ${processedPath}`);

    await processVideo(
      video.filePath,
      processedPath,
      async (progress, message) => {
        // Update progress in database
        video.processingProgress = progress;
        await video.save();

        // Emit progress update (only if io is available)
        if (io) {
          const userId = video.userId?.toString() || video.userId;
          const userRoom = `user-${userId}`;
          io.to(userRoom).emit('video-processing', {
            videoId: video._id.toString(),
            status: 'processing',
            progress,
            message,
          });
        }
      }
    );

    console.log(`✅ Video processing complete for ${videoId}`);

    // Verify processed file exists
    const processedFileExists = await fs.access(processedPath).then(() => true).catch(() => false);
    if (!processedFileExists) {
      console.error(`❌ Processed file not found: ${processedPath}`);
      throw new Error('Processed video file was not created');
    }
    console.log(`✅ Processed file verified: ${processedPath}`);

    // Run sensitivity analysis
    console.log(`🔍 Running sensitivity analysis for ${videoId}`);
    const analysis = await analyzeSensitivity(video.filePath, {
      duration: video.duration,
      size: video.fileSize,
    });
    console.log(`✅ Analysis complete: ${analysis.classification}`);

    // Update video with results
    video.status = 'completed';
    video.processingProgress = 100;
    video.classification = analysis.classification;
    video.processedFilePath = processedPath;
    await video.save();
    console.log(`✅ Video ${videoId} marked as completed in database`);

    // Emit completion (only if io is available)
    if (io) {
      const userId = video.userId?.toString() || video.userId;
      const userRoom = `user-${userId}`;
      io.to(userRoom).emit('video-processing', {
        videoId: video._id.toString(),
        status: 'completed',
        progress: 100,
        message: 'Processing complete',
        classification: analysis.classification,
      });
    }
  } catch (error) {
    console.error(`Error processing video ${videoId}:`, error);

    // Update video status to failed
    const video = await Video.findById(videoId);
    if (video) {
      video.status = 'failed';
      video.processingError = error.message;
      await video.save();

      // Emit error (only if io is available)
      if (io) {
        const userId = video.userId?.toString() || video.userId;
        const userRoom = `user-${userId}`;
        io.to(userRoom).emit('video-processing', {
          videoId: video._id.toString(),
          status: 'failed',
          progress: 0,
          message: `Processing failed: ${error.message}`,
        });
      }
    }
  }
};

/**
 * @desc    Get all videos for authenticated user
 * @route   GET /api/videos
 * @access  Private
 */
export const getVideos = asyncHandler(async (req, res) => {
  const { status, classification, page = 1, limit = 10, sort = '-createdAt' } = req.query;

  // Build query
  const query = { userId: req.user._id };

  // Admin can see all videos
  if (req.user.role === 'admin') {
    delete query.userId;
  }

  if (status) {
    query.status = status;
  }

  if (classification) {
    query.classification = classification;
  }

  // Pagination
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  // Execute query
  const videos = await Video.find(query)
    .sort(sort)
    .skip(skip)
    .limit(limitNum)
    .populate('userId', 'username email');

  const total = await Video.countDocuments(query);

  res.json({
    success: true,
    data: {
      videos,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    },
  });
});

/**
 * @desc    Get single video by ID
 * @route   GET /api/videos/:id
 * @access  Private
 */
export const getVideo = asyncHandler(async (req, res) => {
  const video = await Video.findById(req.params.id).populate('userId', 'username email');

  if (!video) {
    return res.status(404).json({
      success: false,
      message: 'Video not found',
    });
  }

  // Check ownership (unless admin)
  if (req.user.role !== 'admin' && video.userId._id.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to access this video',
    });
  }

  res.json({
    success: true,
    data: {
      video,
    },
  });
});

/**
 * @desc    Delete a video
 * @route   DELETE /api/videos/:id
 * @access  Private (Editor/Admin only)
 */
export const deleteVideo = asyncHandler(async (req, res) => {
  const video = await Video.findById(req.params.id);

  if (!video) {
    return res.status(404).json({
      success: false,
      message: 'Video not found',
    });
  }

  // Check ownership (unless admin)
  if (req.user.role !== 'admin' && video.userId.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to delete this video',
    });
  }

  // Delete files
  try {
    if (video.filePath) {
      await fs.unlink(video.filePath);
    }
    if (video.processedFilePath) {
      await fs.unlink(video.processedFilePath);
    }
  } catch (error) {
    console.error('Error deleting video files:', error);
    // Continue with database deletion even if file deletion fails
  }

  // Delete from database
  await Video.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: 'Video deleted successfully',
  });
});

/**
 * @desc    Get video processing status
 * @route   GET /api/videos/:id/status
 * @access  Private
 */
export const getVideoStatus = asyncHandler(async (req, res) => {
  const video = await Video.findById(req.params.id).select('status processingProgress classification');

  if (!video) {
    return res.status(404).json({
      success: false,
      message: 'Video not found',
    });
  }

  // Check ownership (unless admin)
  if (req.user.role !== 'admin' && video.userId.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to access this video',
    });
  }

  res.json({
    success: true,
    data: {
      status: video.status,
      progress: video.processingProgress,
      classification: video.classification,
    },
  });
});
