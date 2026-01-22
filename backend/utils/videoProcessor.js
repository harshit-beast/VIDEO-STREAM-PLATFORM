import ffmpeg from 'fluent-ffmpeg';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Video Processing Utility
 * Handles video processing with FFmpeg including:
 * - Metadata extraction
 * - Sensitivity analysis simulation
 * - Video classification
 */

/**
 * Get video metadata using FFmpeg
 */
export const getVideoMetadata = (videoPath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) {
        reject(err);
        return;
      }

      const videoStream = metadata.streams.find(
        (stream) => stream.codec_type === 'video'
      );

      const audioStream = metadata.streams.find(
        (stream) => stream.codec_type === 'audio'
      );

      resolve({
        duration: metadata.format.duration || 0,
        width: videoStream?.width || null,
        height: videoStream?.height || null,
        codec: videoStream?.codec_name || null,
        bitrate: metadata.format.bit_rate ? parseInt(metadata.format.bit_rate) : null,
        size: metadata.format.size || 0,
        format: metadata.format.format_name || null,
        hasAudio: !!audioStream,
      });
    });
  });
};

/**
 * Simulate sensitivity analysis
 * In production, this would integrate with ML models or content moderation APIs
 */
export const analyzeSensitivity = async (videoPath, metadata) => {
  // Simulate processing delay
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Simulate analysis logic
  // In production, this would use actual ML models or APIs
  const randomFactor = Math.random();
  
  // Classification logic (simplified)
  // Longer videos or larger files might have higher chance of being flagged
  const durationFactor = metadata.duration > 300 ? 0.3 : 0.1; // 5+ min videos
  const sizeFactor = metadata.size > 100000000 ? 0.2 : 0.1; // 100MB+ files
  
  const flaggedProbability = durationFactor + sizeFactor;
  
  const classification = randomFactor < flaggedProbability ? 'flagged' : 'safe';
  
  return {
    classification,
    confidence: Math.random() * 0.3 + 0.7, // 70-100% confidence
    reasons: classification === 'flagged' 
      ? ['Content analysis detected potential sensitive material']
      : ['Content appears safe for streaming'],
  };
};

/**
 * Process video with progress tracking
 * This function simulates video processing with progress updates
 */
export const processVideo = async (videoPath, outputPath, onProgress) => {
  return new Promise((resolve, reject) => {
    // For production, you would do actual video processing here
    // This is a simulation that updates progress
    
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15; // Random progress increment
      
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        
        // Copy original file to processed directory (simulation)
        // In production, you might transcode, compress, or apply filters
        fs.copyFile(videoPath, outputPath)
          .then(() => {
            onProgress(100, 'Processing complete');
            resolve({
              success: true,
              processedPath: outputPath,
            });
          })
          .catch(reject);
      } else {
        const messages = [
          'Analyzing video structure...',
          'Extracting metadata...',
          'Running sensitivity analysis...',
          'Processing video frames...',
          'Applying filters...',
          'Finalizing processing...',
        ];
        const messageIndex = Math.floor((progress / 100) * messages.length);
        onProgress(Math.floor(progress), messages[messageIndex] || 'Processing...');
      }
    }, 500); // Update every 500ms
  });
};

/**
 * Validate video file
 */
export const validateVideoFile = (file) => {
  const allowedMimeTypes = process.env.ALLOWED_VIDEO_TYPES?.split(',') || [
    'video/mp4',
    'video/mpeg',
    'video/quicktime',
    'video/x-msvideo',
    'video/webm',
  ];

  const maxSize = parseInt(process.env.MAX_FILE_SIZE) || 500000000; // 500MB default

  if (!file) {
    throw new Error('No video file provided');
  }

  if (!allowedMimeTypes.includes(file.mimetype)) {
    throw new Error(`Invalid file type. Allowed types: ${allowedMimeTypes.join(', ')}`);
  }

  if (file.size > maxSize) {
    throw new Error(`File size exceeds maximum allowed size of ${maxSize / 1000000}MB`);
  }

  return true;
};
