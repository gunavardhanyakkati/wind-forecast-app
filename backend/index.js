require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Proxy endpoints for BMRS API
const BMRS_API_BASE = 'https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets';

// Filter data manually based on 'horizon' parameter (in hours)
function filterForecasts(forecasts, targetTimeStr, horizonHours) {
    const targetTime = new Date(targetTimeStr).getTime();
    const cutoffTime = targetTime - (horizonHours * 60 * 60 * 1000); // T - H

    let latestForecast = null;
    let maxPublishTime = -1;

    for (const f of forecasts) {
        // Find forecasts matching the exact same target time
        if (f.startTime === targetTimeStr) {
            const pubTime = new Date(f.publishTime).getTime();
            // publishTime <= targetTime - horizon
            if (pubTime <= cutoffTime) {
                if (pubTime > maxPublishTime) {
                    maxPublishTime = pubTime;
                    latestForecast = f;
                }
            }
        }
    }
    return latestForecast;
}

app.get('/api/data', async (req, res) => {
    try {
        const { start, end, horizon } = req.query;
        if (!start || !end || horizon === undefined) {
            return res.status(400).json({ error: 'Missing start, end, or horizon query parameters' });
        }

        const horizonHours = parseFloat(horizon);

        // Fetch Actuals
        // Usually BMRS stream APIs require some standard datetime format, e.g. YYYY-MM-DD
        const actualsUrl = `https://data.elexon.co.uk/bmrs/api/v1/datasets/FUELHH/stream?publishTimeFrom=${start}&publishTimeTo=${end}`;
        console.log(`Fetching actuals from: ${actualsUrl}`);
        
        // Let's actually use the endpoint the user provided but it seems to be /stream endpoint
        // BMRS API Documentation link user provided: https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/FUELHH/stream
        // Note: The new BMRS API (Elexon Insights) uses data.elexon.co.uk
        const actualsResponse = await axios.get(`https://data.elexon.co.uk/bmrs/api/v1/datasets/FUELHH/stream?publishTimeFrom=${start}&publishTimeTo=${end}`);
        const allActuals = actualsResponse.data;

        // Fetch Forecasts
        const forecastsResponse = await axios.get(`https://data.elexon.co.uk/bmrs/api/v1/datasets/WINDFOR/stream?publishTimeFrom=${start}&publishTimeTo=${end}`);
        const allForecasts = forecastsResponse.data;

        // Process data
        const actualsMap = {};
        
        // Filter actuals for WIND only
        if (Array.isArray(allActuals)) {
             allActuals.forEach(item => {
                if (item.fuelType === 'WIND') {
                    // Normalize target time
                    actualsMap[item.startTime] = item.generation;
                }
             });
        }

        const combinedData = [];

        // For each actual target time, find the corresponding latest forecast
        const uniqueTargetTimes = Object.keys(actualsMap).sort();

        for (const tTime of uniqueTargetTimes) {
            let actualGen = actualsMap[tTime];
            let matchedForecast = filterForecasts(allForecasts, tTime, horizonHours);

            if (matchedForecast) {
                combinedData.push({
                    targetTime: tTime,
                    actualGeneration: actualGen,
                    forecastGeneration: matchedForecast.generation,
                    forecastPublishTime: matchedForecast.publishTime
                });
            } else {
                // If there's no valid forecast matching the rule, don't plot any values (per requirements)
                // We'll exclude this data point or put null depending on chart preference. Let's exclude.
            }
        }

        res.json({
            data: combinedData
        });

    } catch (error) {
        console.error("Error fetching data:", error.message);
        res.status(500).json({ error: 'Failed to fetch external data', details: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
});
