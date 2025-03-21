import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { format } from 'date-fns';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface TrendData {
  date: string;
  count: number;
  avg_rating: number;
}

interface SatisfactionTrendProps {
  trendData: TrendData[];
}

const SatisfactionTrend: React.FC<SatisfactionTrendProps> = ({ trendData }) => {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Feedback Trends (Last 7 Days)',
        font: {
          size: 16,
          weight: 'bold' as const,
        },
        padding: {
          bottom: 20
        }
      },
    },
    scales: {
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        min: 0,
        title: {
          display: true,
          text: 'Number of Feedbacks'
        }
      },
      y2: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        min: 1,
        max: 5,
        grid: {
          drawOnChartArea: false,
        },
        title: {
          display: true,
          text: 'Average Rating'
        }
      },
    },
  };

  const data = {
    labels: trendData.map(item => format(new Date(item.date), 'MMM d')),
    datasets: [
      {
        label: 'Number of Feedbacks',
        data: trendData.map(item => item.count),
        borderColor: 'rgb(13, 148, 136)',
        backgroundColor: 'rgba(13, 148, 136, 0.5)',
        yAxisID: 'y1',
      },
      {
        label: 'Average Rating',
        data: trendData.map(item => item.avg_rating),
        borderColor: 'rgb(234, 179, 8)',
        backgroundColor: 'rgba(234, 179, 8, 0.5)',
        yAxisID: 'y2',
      },
    ],
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div style={{ height: '300px' }}>
        <Line options={options} data={data} />
      </div>
    </div>
  );
};

export default SatisfactionTrend;
