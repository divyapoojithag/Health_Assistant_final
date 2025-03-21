import React from 'react';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';

interface FeedbackOverviewProps {
  totalFeedback: number;
  averageRating: number;
  satisfactionRate: number;
}

const FeedbackOverview: React.FC<FeedbackOverviewProps> = ({
  totalFeedback,
  averageRating,
  satisfactionRate,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Total Feedback Card */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Total Feedback</h3>
          <div className="bg-teal-100 rounded-full p-2">
            <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <p className="mt-2 text-3xl font-bold text-gray-900">{totalFeedback}</p>
        <p className="mt-1 text-sm text-gray-500">Total responses collected</p>
      </div>

      {/* Average Rating Card */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Average Rating</h3>
          <div className="bg-blue-100 rounded-full p-2">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </div>
        </div>
        <p className="mt-2 text-3xl font-bold text-gray-900">{averageRating.toFixed(1)}/5.0</p>
        <p className="mt-1 text-sm text-gray-500">Average user rating</p>
      </div>

      {/* Satisfaction Rate Card */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Satisfaction Rate</h3>
          <div className="bg-green-100 rounded-full p-2">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <div className="mt-2 flex items-baseline">
          <p className="text-3xl font-bold text-gray-900">{satisfactionRate}%</p>
          <p className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
            <ArrowUpIcon className="self-center flex-shrink-0 h-5 w-5 text-green-500" aria-hidden="true" />
            <span className="sr-only">Increased by</span>
            2.5%
          </p>
        </div>
        <p className="mt-1 text-sm text-gray-500">Users satisfied with service</p>
      </div>
    </div>
  );
};

export default FeedbackOverview;
