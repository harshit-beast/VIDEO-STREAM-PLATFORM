import express from 'express';
import { streamVideo } from '../controllers/streamController.js';
// Note: protect middleware is not used here because video tag can't send custom headers
// Authentication is handled in the controller using query param token

const router = express.Router();

/**
 * Streaming Routes
 * - GET /api/stream/:id - Stream video with HTTP Range Request support
 * - OPTIONS /api/stream/:id - CORS preflight for video streaming
 */
// Handle OPTIONS for CORS preflight
router.options('/:id', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Range, Authorization');
  res.header('Access-Control-Expose-Headers', 'Content-Range, Content-Length, Accept-Ranges');
  res.sendStatus(200);
});

router.get('/:id', streamVideo);

export default router;
