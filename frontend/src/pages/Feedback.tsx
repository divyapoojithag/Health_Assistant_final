import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

interface FeedbackForm {
  rating: number;
  comment: string;
  satisfied: boolean;
}

const Feedback: React.FC = () => {
  const navigate = useNavigate();
  const { userProfile, logout } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  const [feedback, setFeedback] = useState<FeedbackForm>({
    rating: 5,
    comment: '',
    satisfied: true
  });

  /*useEffect(() => {
    if (!userProfile?.username) {
      navigate('/login');
    }
  }, [userProfile, navigate]);*/

  useEffect(() => {
    if (!userProfile?.username) {
      console.warn("User not authenticated, but allowing feedback submission.");
    }
  }, []);
  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      if (!userProfile?.username) {
        throw new Error('User not authenticated');
      }

      /*const response = await axios.post('http://localhost:8080/health_assistant/feedback', {
        ...feedback,
        username: userProfile.username
      }, {
        withCredentials: true
      });*/

      const response = await axios.post('http://localhost:8080/health_assistant/feedback', 
        { ...feedback, username: userProfile?.username || "Guest" }, 
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );

      console.log('Feedback submission response:', response.data);
      
      if (response.data.success) {
        navigate('/login');
      } else {
        setError(response.data.message || 'Unexpected response from server');
      }
    } catch (error: any) {
      console.error('Error submitting feedback:', error);
      setError(error.response?.data?.message || error.message || 'Failed to submit feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFeedback(prev => ({
      ...prev,
      [name]: type === 'checkbox' 
        ? (e.target as HTMLInputElement).checked
        : type === 'number' 
          ? parseInt(value, 10)
          : value
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-sm p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Share Your Experience</h2>
          <p className="mt-2 text-sm text-gray-600">
            Your feedback helps us improve our health assistant
          </p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Rating Field */}
          <div className="space-y-1">
            <label htmlFor="rating" className="block text-sm font-medium text-gray-700">
              Rating (1-5)
            </label>
            <input
              type="number"
              id="rating"
              name="rating"
              min="1"
              max="5"
              value={feedback.rating}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              required
            />
          </div>

          {/* Comment Field */}
          <div className="space-y-1">
            <label htmlFor="comment" className="block text-sm font-medium text-gray-700">
              Comments (Optional)
            </label>
            <textarea
              id="comment"
              name="comment"
              rows={4}
              value={feedback.comment}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Share your thoughts about your experience..."
            />
          </div>

          {/* Satisfaction Field */}
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="satisfied"
              name="satisfied"
              checked={feedback.satisfied}
              onChange={handleInputChange}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="satisfied" className="text-sm font-medium text-gray-700">
              I am satisfied with the service
            </label>
          </div>

          {/* Buttons */}
          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-md bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
            </button>
            <button
              type="button"
              onClick={() => {
                navigate('/login');
              }}
              className="flex-1 rounded-md bg-gray-200 py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Skip Feedback
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Feedback;
