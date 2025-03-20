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

  useEffect(() => {
    // Redirect to login if no user is logged in
    if (!userProfile?.username) {
      navigate('/login');
    }
  }, [userProfile, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      if (!userProfile?.id) {  // username changed to id 
        throw new Error('User not authenticated');
      }

      /*const response = await axios.post('http://localhost:8080/health_assistant/feedback', 
        feedback,
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
          }
        }*/


          const payload = { ...feedback, user_id: userProfile.id };
          console.log("Submitting payload:", payload);
        
          const response = await axios.post('http://localhost:8080/health_assistant/feedback', 
            payload,
            {
              withCredentials: true,
              headers: { 'Content-Type': 'application/json' }
            }        
      );

      console.log('Feedback submission response:', response.data);
      
      if (response.data.success) {
        logout();
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

  const handleSkip = async () => {
    setIsSubmitting(true);
    try {
      const response = await axios.post('http://localhost:8080/health_assistant/skip-feedback', 
        {},
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      if (response.data.success) {
        logout();
        navigate('/login');
      } else {
        setError(response.data.message || 'Failed to skip feedback');
      }
    } catch (error: any) {
      console.error('Error skipping feedback:', error);
      setError(error.response?.data?.message || error.message || 'Failed to skip feedback');
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
    <div className="min-h-screen flex items-center justify-center relative">
      {/* Background Image */}
      <div 
        className="absolute inset-0 z-0" 
        style={{
          backgroundImage: 'url("https://images.unsplash.com/photo-1505751172876-fa1923c5c528?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2070&q=80")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'brightness(0.9)'
        }}
      />

      <div className="max-w-2xl w-full space-y-8 p-10 bg-white/95 backdrop-blur-md rounded-xl shadow-2xl relative z-10 mx-4">
        <div className="text-center">
          {/* Medical Icon */}
          <div className="mx-auto h-16 w-16 text-teal-600 mb-4">
            <svg className="h-full w-full" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" fill="currentColor"/>
              <path d="M13 7h-2v4H7v2h4v4h2v-4h4v-2h-4V7z" fill="currentColor"/>
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Share Your Experience</h2>
          <p className="text-sm text-teal-600 mb-8">
            Your feedback helps us improve our health assistant
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4 mb-6">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Rating Field */}
          <div className="space-y-2">
            <label htmlFor="rating" className="block text-sm font-medium text-gray-700">
              How would you rate your experience? (1-5)
            </label>
            <div className="flex space-x-4 items-center">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFeedback(prev => ({ ...prev, rating: value }))}
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold transition-colors duration-200 ${
                    feedback.rating === value
                      ? 'bg-teal-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>

          {/* Comment Field */}
          <div className="space-y-2">
            <label htmlFor="comment" className="block text-sm font-medium text-gray-700">
              Would you like to share more about your experience?
            </label>
            <textarea
              id="comment"
              name="comment"
              rows={4}
              value={feedback.comment}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-lg border border-gray-300 shadow-sm py-3 px-4 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 sm:text-sm transition duration-150 ease-in-out"
              placeholder="Your feedback helps us serve you better..."
            />
          </div>

          {/* Satisfaction Field */}
          <div className="flex items-center space-x-3 bg-gray-50 p-4 rounded-lg">
            <input
              type="checkbox"
              id="satisfied"
              name="satisfied"
              checked={feedback.satisfied}
              onChange={handleInputChange}
              className="h-5 w-5 rounded border-gray-300 text-teal-600 focus:ring-teal-500 transition duration-150 ease-in-out"
            />
            <label htmlFor="satisfied" className="text-sm font-medium text-gray-700">
              Overall, I am satisfied with the service
            </label>
          </div>

          {/* Buttons */}
          <div className="flex space-x-4 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-lg bg-teal-600 py-3 px-4 text-sm font-semibold text-white shadow-sm hover:bg-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50 transition duration-150 ease-in-out"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
            </button>
            <button
              type="button"
              onClick={handleSkip}
              disabled={isSubmitting}
              className="flex-1 rounded-lg bg-gray-100 py-3 px-4 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 transition duration-150 ease-in-out"
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
