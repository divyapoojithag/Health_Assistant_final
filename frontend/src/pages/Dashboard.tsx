import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

interface ConfigOption {
  id: string;
  name: string;
}

interface AIConfig {
  llmModel: string;
  vectorDB: string;
}

const Dashboard: React.FC = () => {
  const { isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [selectedLLM, setSelectedLLM] = useState<string>('');
  const [selectedVectorDB, setSelectedVectorDB] = useState<string>('');

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

    // Redirect non-admin users to chat
    if (!isAdmin()) {
      navigate('/chat');
    }
  }, [isAuthenticated, isAdmin, navigate]);

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
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
              <p className="text-gray-600">Configure AI model and vector database settings</p>
            </div>
            <button
              onClick={() => navigate('/chat')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-colors duration-200"
            >
              Go to Chat Interface
            </button>
          </div>

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
