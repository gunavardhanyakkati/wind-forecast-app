import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';
import axios from 'axios';
import './index.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

export default function App() {
  // Default values: Jan 1st 2025 to Jan 2nd 2025
  const defaultStart = '2025-01-01T00:00';
  const defaultEnd = '2025-01-02T00:00';

  const [start, setStart] = useState(defaultStart);
  const [end, setEnd] = useState(defaultEnd);
  const [horizon, setHorizon] = useState(4);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Ensure ISO format for API
      const startIso = new Date(start).toISOString();
      const endIso = new Date(end).toISOString();
      
      const response = await axios.get(`http://localhost:5000/api/data`, {
        params: {
          start: startIso,
          end: endIso,
          horizon: horizon
        }
      });
      
      setChartData(response.data.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (start && end) {
      fetchData();
    }
    // eslint-disable-next-line
  }, [start, end, horizon]);

  const dataConfig = {
    datasets: [
      {
        label: 'Actual Generation (MW)',
        data: chartData.map(d => ({ x: new Date(d.targetTime), y: d.actualGeneration })),
        borderColor: 'rgba(54, 162, 235, 1)', // Blue
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        pointRadius: 2,
        tension: 0.2
      },
      {
        label: `Forecasted Generation (-${horizon}h) (MW)`,
        data: chartData.map(d => ({ x: new Date(d.targetTime), y: d.forecastGeneration })),
        borderColor: 'rgba(75, 192, 192, 1)', // Green
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        pointRadius: 2,
        tension: 0.2,
        borderDash: [5, 5]
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'hour',
          displayFormats: {
            hour: 'MMM d, HH:mm'
          }
        },
        title: {
          display: true,
          text: 'Target Time'
        }
      },
      y: {
        title: {
          display: true,
          text: 'Generation (MW)'
        },
        beginAtZero: true
      }
    },
    plugins: {
      title: {
        display: true,
        text: 'UK Wind Power Generation: Actual vs Forecast',
        font: { size: 16 }
      },
      tooltip: {
        callbacks: {
          afterBody: function(context) {
            if (context[0] && chartData[context[0].dataIndex]) {
               const dataPoint = chartData[context[0].dataIndex];
               return `Forecast published at: ${new Date(dataPoint.forecastPublishTime).toLocaleTimeString()}`;
            }
            return '';
          }
        }
      }
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Wind Power Forecast Monitor</h1>
      </header>

      <div className="controls-panel">
        <div className="control-group">
          <label>Start Time</label>
          <input 
            type="datetime-local" 
            value={start} 
            onChange={(e) => setStart(e.target.value)} 
          />
        </div>
        <div className="control-group">
          <label>End Time</label>
          <input 
            type="datetime-local" 
            value={end} 
            onChange={(e) => setEnd(e.target.value)} 
          />
        </div>
        <div className="control-group slider-group">
          <label>Forecast Horizon: <strong>{horizon} hours</strong></label>
          <input 
            type="range" 
            min="0" 
            max="48" 
            value={horizon}
            onChange={(e) => setHorizon(Number(e.target.value))}
          />
          <div className="slider-labels">
            <span>0</span>
            <span>24</span>
            <span>48</span>
          </div>
        </div>
      </div>

      <div className="chart-container">
        {loading && <div className="loading-overlay">Loading Data...</div>}
        {error && <div className="error-message">{error}</div>}
        
        {!error && chartData.length > 0 && (
          <Line data={dataConfig} options={chartOptions} />
        )}
        
        {!loading && !error && chartData.length === 0 && (
          <div className="empty-state">
            <p>No data available for the selected range and horizon.</p>
            <p>Ensure date range is from Jan 2025 onwards.</p>
          </div>
        )}
      </div>
    </div>
  );
}
