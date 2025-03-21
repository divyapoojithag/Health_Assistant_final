import React from 'react';
import { format } from 'date-fns';

interface FeedbackEntry {
  id: number;
  username: string;
  rating: number;
  comment: string;
  satisfied: boolean;
  given_on: string;
}

interface FeedbackTableProps {
  feedbacks: FeedbackEntry[];
}

const FeedbackTable: React.FC<FeedbackTableProps> = ({ feedbacks }) => {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="sm:flex sm:items-center p-6">
        <div className="sm:flex-auto">
          <h3 className="text-lg font-medium text-gray-900">Recent Feedback</h3>
          <p className="mt-2 text-sm text-gray-700">
            A list of all feedback received from users including their ratings and comments.
          </p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rating
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Comment
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Satisfied
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {feedbacks.map((feedback) => (
              <tr key={feedback.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {feedback.username}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex items-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      feedback.rating >= 4 ? 'bg-green-100 text-green-800' :
                      feedback.rating >= 3 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {feedback.rating}/5
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 max-w-md">
                  <div className="truncate">
                    {feedback.comment || '-'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {feedback.satisfied ? (
                    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                      Yes
                    </span>
                  ) : (
                    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                      No
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {format(new Date(feedback.given_on), 'MMM d, yyyy')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FeedbackTable;
