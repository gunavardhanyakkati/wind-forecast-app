require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Helper to grab the most recently published forecast for a given time
// making sure it was published before our H-hour horizon cutoff.
const getLatestForecast = (forecastList, targetTimeStr, horizonHrs) => {
    const targetMs = new Date(targetTimeStr).getTime();
    const cutoffMs = targetMs - (horizonHrs * 60 * 60 * 1000); // T minus H

    let latest = null;
    let maxPubMs = -1;

    for (let f of forecastList) {
        const startMs = new Date(f.startTime).getTime();
        
        if (startMs === targetMs) {
            const pubMs = new Date(f.publishTime).getTime();
            // Did it come out before our cutoff?
            if (pubMs <= cutoffMs && pubMs > maxPubMs) {
                maxPubMs = pubMs;
                latest = f;
            }
        }
    }
    return latest;
};

// Main data fetching endpoint
app.get('/api/data', async (req, res) => {
    try {
        const { start, end, horizon } = req.query;
        
        // Bail out if anything is missing
        if (!start || !end || horizon === undefined) {
            return res.status(400).json({ error: 'Missing required query params (start, end, horizon)' });
        }

        const horizonHours = parseFloat(horizon);

        // API parameters require simple YYYY-MM-DD for settlementDate
        const startSettlement = start.substring(0, 10);
        const endSettlement = end.substring(0, 10);

        // Fetch Actuals bounded by settlementDate
        const actualsResponse = await axios.get(`https://data.elexon.co.uk/bmrs/api/v1/datasets/FUELHH?settlementDateFrom=${startSettlement}&settlementDateTo=${endSettlement}`);
        // Elexon's API nests the payload inside a 'data' array
        const allActuals = actualsResponse.data.data || [];

        // WINDFOR expects publish time filters, not target time.
        // Pad the start time backwards by (horizon + 12h) just to be safe and catch early publications.
        const startDate = new Date(start);
        const bufferedStartMs = startDate.getTime() - ((horizonHours + 12) * 60 * 60 * 1000);
        
        const bufferedStart = new Date(bufferedStartMs).toISOString();
        // End time can technically just be 'end'
        const bufferedEnd = end;

        console.log(`Fetching actuals from ${startSettlement} to ${endSettlement}`);
        console.log(`Fetching forecasts from ${bufferedStart} to ${bufferedEnd}`);

        const forecastsResponse = await axios.get(`https://data.elexon.co.uk/bmrs/api/v1/datasets/WINDFOR?publishDateTimeFrom=${bufferedStart}&publishDateTimeTo=${bufferedEnd}`);
        const allForecasts = forecastsResponse.data.data || [];
        
        console.log(`Received ${allActuals.length} actuals and ${allForecasts.length} forecasts.`);

        const actualsMap = {};
        
        // Build a lookup map for actuals by timestamp
        if (Array.isArray(allActuals)) {
             for (const item of allActuals) {
                if (item.fuelType === 'WIND') {
                    // Timestamp in ms is safer than comparing raw ISO strings
                    actualsMap[new Date(item.startTime).getTime()] = item;
                }
             }
        }

        const combinedData = [];
        const targetTimeWindowStart = new Date(start).getTime();
        const targetTimeWindowEnd = new Date(end).getTime();

        const uniqueTargetTimes = Object.keys(actualsMap).map(Number).sort((a,b) => a - b);

        for (const tTime of uniqueTargetTimes) {
            // Only plot values within the exact requested UI bounds (since settlementDate gets full day)
            if (tTime >= targetTimeWindowStart && tTime <= targetTimeWindowEnd) {
                let actualItem = actualsMap[tTime];
                let matchedForecast = getLatestForecast(allForecasts, actualItem.startTime, horizonHours);

                if (matchedForecast) {
                    combinedData.push({
                        targetTime: actualItem.startTime, 
                        actualGeneration: actualItem.generation,
                        forecastGeneration: matchedForecast.generation,
                        forecastPublishTime: matchedForecast.publishTime
                    });
                }
            }
        }

        console.log(`Successfully mapped ${combinedData.length} data points.`);
        
        res.json({ data: combinedData });

    } catch (err) {
        console.error("Failed to fetch from Elexon:", err.message);
        // Sometimes Elexon just times out or returns huge payloads, pass it along
        res.status(500).json({ error: 'Data fetch failed', details: err.response?.data || err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
});
