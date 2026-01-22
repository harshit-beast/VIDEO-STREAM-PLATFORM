import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import VideoPlayer from '../components/VideoPlayer';

/**
 * Dashboard Page
 * Displays user's video library with real-time processing updates
 */
const Dashboard = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    classification: '',
  });
  const [selectedVideo, setSelectedVideo] = useState(null);
  const { socket } = useSocket();
  const { user } = useAuth();

  // Fetch videos
  const fetchVideos = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.classification) params.append('classification', filters.classification);

      const response = await api.get(`/videos?${params.toString()}`);
      setVideos(response.data.data.videos);
      setError(null);
    } catch (error) {
      setError('Failed to load videos. Please try again.');
      console.error('Error fetching videos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchVideos();
  }, [filters]);

  // Listen for real-time processing updates
  useEffect(() => {
    if (socket) {
      const handleProcessingUpdate = (data) => {
        setVideos((prevVideos) =>
          prevVideos.map((video) =>
            video._id === data.videoId
              ? {
                  ...video,
                  status: data.status,
                  processingProgress: data.progress,
                  classification: data.classification || video.classification,
                }
              : video
          )
        );
      };

      socket.on('video-processing', handleProcessingUpdate);

      return () => {
        socket.off('video-processing', handleProcessingUpdate);
      };
    }
  }, [socket]);

  // Delete video
  const handleDelete = async (videoId) => {
    if (!window.confirm('Are you sure you want to delete this video?')) {
      return;
    }

    try {
      await api.delete(`/videos/${videoId}`);
      setVideos(videos.filter((v) => v._id !== videoId));
      if (selectedVideo?._id === videoId) {
        setSelectedVideo(null);
      }
    } catch (error) {
      alert('Failed to delete video. Please try again.');
    }
  };

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get classification badge color
  const getClassificationColor = (classification) => {
    switch (classification) {
      case 'safe':
        return 'bg-green-100 text-green-800';
      case 'flagged':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Video Library</h1>
            <div className="flex gap-4 items-center">
              <span className="text-sm text-gray-600">Welcome, {user?.username}</span>
              <Link to="/upload" className="btn btn-primary">
                Upload Video
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="card mb-6">
          <h2 className="text-lg font-semibold mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                className="input"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <option value="">All Statuses</option>
                <option value="uploaded">Uploaded</option>
                <option value="processing">Processing</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Classification
              </label>
              <select
                className="input"
                value={filters.classification}
                onChange={(e) =>
                  setFilters({ ...filters, classification: e.target.value })
                }
              >
                <option value="">All Classifications</option>
                <option value="safe">Safe</option>
                <option value="flagged">Flagged</option>
              </select>
            </div>
          </div>
        </div>

        {/* Video List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading videos...</p>
          </div>
        ) : error ? (
          <div className="card bg-red-50 border border-red-200">
            <p className="text-red-800">{error}</p>
          </div>
        ) : videos.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-600 mb-4">No videos found.</p>
            <Link to="/upload" className="btn btn-primary">
              Upload Your First Video
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Video List */}
            <div className="lg:col-span-2 space-y-4">
              {videos.map((video) => (
                <div key={video._id} className="card hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-2">{video.title}</h3>
                      <p className="text-sm text-gray-600 mb-2">{video.description}</p>
                      <div className="flex flex-wrap gap-2 mb-2">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                            video.status
                          )}`}
                        >
                          {video.status}
                        </span>
                        {video.classification && (
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${getClassificationColor(
                              video.classification
                            )}`}
                          >
                            {video.classification}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 space-y-1">
                        <p>Size: {formatFileSize(video.fileSize)}</p>
                        {video.duration && (
                          <p>Duration: {Math.floor(video.duration / 60)}:{(video.duration % 60).toFixed(0).padStart(2, '0')}</p>
                        )}
                        <p>Uploaded: {new Date(video.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      {video.status === 'completed' && (
                        <button
                          onClick={() => setSelectedVideo(video)}
                          className="btn btn-primary text-sm"
                        >
                          Play
                        </button>
                      )}
                      {(user?.role === 'editor' || user?.role === 'admin') && (
                        <button
                          onClick={() => handleDelete(video._id)}
                          className="btn btn-danger text-sm"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                  {video.status === 'processing' && (
                    <div className="mt-4">
                      <div className="flex justify-between text-sm text-gray-600 mb-2">
                        <span>Processing...</span>
                        <span>{video.processingProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${video.processingProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Video Player Sidebar */}
            <div className="lg:col-span-1">
              {selectedVideo ? (
                <div className="card sticky top-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">{selectedVideo.title}</h3>
                    <button
                      onClick={() => setSelectedVideo(null)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      ✕
                    </button>
                  </div>
                  <VideoPlayer videoId={selectedVideo._id} videoTitle={selectedVideo.title} />
                </div>
              ) : (
                <div className="card text-center py-12 text-gray-500">
                  <p>Select a video to play</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
