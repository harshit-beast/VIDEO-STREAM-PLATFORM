import mongoose from 'mongoose';

/**
 * Video Schema
 * Stores video metadata with processing status and classification
 * Multi-tenant: Each video is associated with a user
 */
const videoSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true, // Index for faster queries
    },
    title: {
      type: String,
      required: [true, 'Video title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
      default: '',
    },
    filename: {
      type: String,
      required: true,
    },
    originalFilename: {
      type: String,
      required: true,
    },
    filePath: {
      type: String,
      required: true,
    },
    processedFilePath: {
      type: String,
      default: null,
    },
    fileSize: {
      type: Number,
      required: true, // Size in bytes
    },
    mimeType: {
      type: String,
      required: true,
    },
    duration: {
      type: Number,
      default: null, // Duration in seconds
    },
    status: {
      type: String,
      enum: ['uploaded', 'processing', 'completed', 'failed'],
      default: 'uploaded',
      index: true,
    },
    processingProgress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    classification: {
      type: String,
      enum: ['safe', 'flagged', null],
      default: null,
      index: true,
    },
    processingError: {
      type: String,
      default: null,
    },
    metadata: {
      width: { type: Number, default: null },
      height: { type: Number, default: null },
      codec: { type: String, default: null },
      bitrate: { type: Number, default: null },
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

// Compound index for efficient filtering
videoSchema.index({ userId: 1, status: 1 });
videoSchema.index({ userId: 1, classification: 1 });
videoSchema.index({ userId: 1, createdAt: -1 });

// Virtual for formatted file size
videoSchema.virtual('formattedFileSize').get(function () {
  const bytes = this.fileSize;
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
});

// Ensure virtuals are included in JSON output
videoSchema.set('toJSON', { virtuals: true });

const Video = mongoose.model('Video', videoSchema);

export default Video;
