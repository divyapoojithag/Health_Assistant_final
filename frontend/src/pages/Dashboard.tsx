import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import FeedbackOverview from '../components/analytics/FeedbackOverview';
import RatingDistribution from '../components/analytics/RatingDistribution';
import SatisfactionTrend from '../components/analytics/SatisfactionTrend';
import FeedbackTable from '../components/analytics/FeedbackTable';

interface ConfigOption {
  id: string;
  name: string;
}

interface AIConfig {
  llmModel: string;
  vectorDB: string;
}

interface FeedbackAnalytics {
  total_feedback: number;
  average_rating: number;
  satisfaction_rate: number;
  rating_distribution: Record<number, number>;
  daily_trends: Array<{
    date: string;
    count: number;
    avg_rating: number;
  }>;
}

interface FeedbackEntry {
  id: number;
  username: string;
  rating: number;
  comment: string;
  satisfied: boolean;
  given_on: string;
}

const Dashboard: React.FC = () => {
  const { isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [selectedLLM, setSelectedLLM] = useState<string>('');
  const [selectedVectorDB, setSelectedVectorDB] = useState<string>('');
  const [analytics, setAnalytics] = useState<FeedbackAnalytics | null>(null);
  const [feedbacks, setFeedbacks] = useState<FeedbackEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const llmOptions: ConfigOption[] = [
    { id: 'gpt35', name: 'GPT-3.5' },
    { id: 'perplexity', name: 'Perplexity' },
  ];

  const vectorDBOptions: ConfigOption[] = [
    { id: 'pinecone', name: 'Pinecone' },
    { id: 'weaviate', name: 'Weaviate' },
  ];

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!isAdmin()) {
      navigate('/chat');
      return;
    }

    fetchAnalytics();
    fetchFeedbacks();
  }, [isAuthenticated, isAdmin, navigate]);

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get('http://localhost:8080/health_assistant/feedback-analytics', {
        withCredentials: true
      });
      if (response.data.success) {
        setAnalytics(response.data.data);
      } else {
        setError('Failed to fetch analytics data');
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setError('An error occurred while fetching analytics');
    }
  };

  const fetchFeedbacks = async () => {
    try {
      const response = await axios.get('http://localhost:8080/health_assistant/feedback-details', {
        withCredentials: true
      });
      if (response.data.success) {
        setFeedbacks(response.data.data);
      } else {
        setError('Failed to fetch feedback details');
      }
    } catch (error) {
      console.error('Error fetching feedbacks:', error);
      setError('An error occurred while fetching feedback details');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async () => {
    try {
      const config: AIConfig = {
        llmModel: selectedLLM,
        vectorDB: selectedVectorDB
      };

      await axios.post('http://localhost:8080/health_assistant/config', config);
      navigate('/chat');
    } catch (error) {
      console.error('Error saving configuration:', error);
      setError('Failed to save configuration');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
            <p className="text-gray-600">Monitor feedback and configure AI settings</p>
          </div>
          <button
            onClick={() => navigate('/chat')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-colors duration-200"
          >
            Go to Chat Interface
          </button>
        </div>

        {error && (
          <div className="mb-8 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Section */}
        {analytics && (
          <div className="space-y-8 mb-12">
            <FeedbackOverview
              totalFeedback={analytics.total_feedback}
              averageRating={analytics.average_rating}
              satisfactionRate={analytics.satisfaction_rate}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <RatingDistribution distribution={analytics.rating_distribution} />
              <SatisfactionTrend trendData={analytics.daily_trends} />
            </div>
          </div>
        )}

        {/* Feedback Table */}
        <div className="mb-12">
          <FeedbackTable feedbacks={feedbacks} />
        </div>

        {/* AI Configuration Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">AI Configuration</h2>
          <div className="space-y-8">
            {/* LLM Configuration */}
            <div>
              <label htmlFor="llm" className="block text-sm font-medium text-gray-700 mb-2">
                Language Model
              </label>
              <select
                id="llm"
                value={selectedLLM}
                onChange={(e) => setSelectedLLM(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-teal-500 focus:border-teal-500 rounded-md"
              >
                <option value="">Select a language model</option>
                {llmOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Vector DB Configuration */}
            <div>
              <label htmlFor="vectordb" className="block text-sm font-medium text-gray-700 mb-2">
                Vector Database
              </label>
              <select
                id="vectordb"
                value={selectedVectorDB}
                onChange={(e) => setSelectedVectorDB(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-teal-500 focus:border-teal-500 rounded-md"
              >
                <option value="">Select a vector database</option>
                {vectorDBOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
              <button
                onClick={handleSaveConfig}
                disabled={!selectedLLM || !selectedVectorDB}
                className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white
                  ${(!selectedLLM || !selectedVectorDB) 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500'}`}
              >
                Save Configuration & Continue
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
