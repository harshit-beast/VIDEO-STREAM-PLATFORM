import { useState, useRef, useEffect } from 'react';
import api from '../utils/api';

/**
 * Video Player Component
 * Streams video using HTTP Range Requests
 */
const VideoPlayer = ({ videoId, videoTitle }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [videoStatus, setVideoStatus] = useState(null);
  const videoRef = useRef(null);

  // Fetch video status
  useEffect(() => {
    const fetchVideoStatus = async () => {
      try {
        const response = await api.get(`/videos/${videoId}`);
        setVideoStatus(response.data.data.video.status);
      } catch (err) {
        console.error('Error fetching video status:', err);
      }
    };

    if (videoId) {
      fetchVideoStatus();
    }
  }, [videoId]);

  useEffect(() => {
    if (videoRef.current && videoId) {
      // Reset error state
      setError(null);
      setLoading(true);
      
      // Set video source to streaming endpoint
      // Pass token as query param since HTML5 video doesn't support custom headers
      const token = localStorage.getItem('token');
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5002/api';
      const videoUrl = `${baseUrl}/stream/${videoId}?token=${token}`;
      
      console.log('Loading video:', videoUrl);
      
      // Clear previous source
      videoRef.current.src = '';
      videoRef.current.load();
      
      // Set new source
      videoRef.current.src = videoUrl;
      
      // Remove old event listeners by cloning the element (cleaner approach)
      const handleLoadedMetadata = () => {
        console.log('Video metadata loaded');
        setLoading(false);
        setError(null);
      };

      const handleCanPlay = () => {
        console.log('Video can play');
        setLoading(false);
        setError(null);
      };

      const handleError = (e) => {
        console.error('Video error:', e);
        const video = videoRef.current;
        let errorMessage = 'Failed to load video.';
        
        if (video && video.error) {
          switch (video.error.code) {
            case video.error.MEDIA_ERR_ABORTED:
              errorMessage = 'Video loading was aborted.';
              break;
            case video.error.MEDIA_ERR_NETWORK:
              errorMessage = 'Network error while loading video. Please check your connection.';
              break;
            case video.error.MEDIA_ERR_DECODE:
              errorMessage = 'Video decoding error. The file may be corrupted or in an unsupported format.';
              break;
            case video.error.MEDIA_ERR_SRC_NOT_SUPPORTED:
              errorMessage = 'Video format not supported by your browser. Try using a different browser or convert the video to MP4 format.';
              break;
            default:
              errorMessage = `Failed to load video. Error code: ${video.error.code}`;
          }
        }
        
        // Check if it's a processing status issue
        if (videoStatus === 'processing') {
          errorMessage = 'Video is still processing. Please wait for processing to complete.';
        } else if (videoStatus === 'failed') {
          errorMessage = 'Video processing failed. The original file may still be playable.';
        }
        
        console.error('Video error details:', {
          error: video?.error,
          networkState: video?.networkState,
          readyState: video?.readyState,
          src: video?.src,
        });
        
        setError(errorMessage);
        setLoading(false);
      };
      
      videoRef.current.addEventListener('loadedmetadata', handleLoadedMetadata);
      videoRef.current.addEventListener('canplay', handleCanPlay);
      videoRef.current.addEventListener('error', handleError);
      
      // Cleanup
      return () => {
        if (videoRef.current) {
          videoRef.current.removeEventListener('loadedmetadata', handleLoadedMetadata);
          videoRef.current.removeEventListener('canplay', handleCanPlay);
          videoRef.current.removeEventListener('error', handleError);
        }
      };
    }
  }, [videoId, videoStatus]);

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800 font-medium mb-2">{error}</p>
        {videoStatus === 'processing' && (
          <p className="text-sm text-red-600">
            Processing in progress. The video will be available once processing completes.
          </p>
        )}
        {videoStatus === 'failed' && (
          <p className="text-sm text-red-600">
            Video processing encountered an error. Please try uploading again.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="w-full">
      {loading && (
        <div className="bg-gray-100 rounded-lg aspect-video flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading video...</p>
          </div>
        </div>
      )}
      <video
        ref={videoRef}
        controls
        preload="metadata"
        playsInline
        className="w-full rounded-lg shadow-lg"
        style={{ display: loading ? 'none' : 'block' }}
        onLoadStart={() => setLoading(true)}
        onCanPlay={() => setLoading(false)}
      >
        <p>Your browser does not support the video tag.</p>
        <p>Please try using a modern browser like Chrome, Firefox, Safari, or Edge.</p>
      </video>
    </div>
  );
};

export default VideoPlayer;
