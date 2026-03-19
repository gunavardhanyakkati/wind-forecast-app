require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Filter data manually based on 'horizon' parameter (in hours)
function filterForecasts(forecasts, targetTimeStr, horizonHours) {
    const targetTime = new Date(targetTimeStr).getTime();
    const cutoffTime = targetTime - (horizonHours * 60 * 60 * 1000); // T - H

    let latestForecast = null;
    let maxPublishTime = -1;

    for (const f of forecasts) {
        const fStartTime = new Date(f.startTime).getTime();
        // Compare target time
        if (fStartTime === targetTime) {
            const pubTime = new Date(f.publishTime).getTime();
            // forecast publish time must be <= cutoffTime
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
            return res.status(400).json({ error: 'Missing parameters' });
        }

        const horizonHours = parseFloat(horizon);

        // API parameters require simple YYYY-MM-DD for settlementDate
        const startSettlement = start.substring(0, 10);
        const endSettlement = end.substring(0, 10);

        // Fetch Actuals specifically bounded by settlementDate
        const actualsResponse = await axios.get(`https://data.elexon.co.uk/bmrs/api/v1/datasets/FUELHH?settlementDateFrom=${startSettlement}&settlementDateTo=${endSettlement}`);
        // The Elexon Insights API returns { data: [...] } instead of an array directly on the root
        const allActuals = actualsResponse.data.data || [];

        // Fetch Forecasts: Forecasts for the target "start" time could be published up to "horizon" hours BEFORE "start".
        // Adding 12 hours buffer to the horizon to ensure we catch the forecast.
        // WINDFOR requires publishDateTimeFrom and publishDateTimeTo!
        const startDate = new Date(start);
        const bufferedStartMs = startDate.getTime() - ((horizonHours + 12) * 60 * 60 * 1000);
        const bufferedStart = new Date(bufferedStartMs).toISOString();
        const bufferedEnd = end;

        console.log(`Fetching actuals from ${startSettlement} to ${endSettlement}`);
        console.log(`Fetching forecasts from ${bufferedStart} to ${bufferedEnd}`);

        const forecastsResponse = await axios.get(`https://data.elexon.co.uk/bmrs/api/v1/datasets/WINDFOR?publishDateTimeFrom=${bufferedStart}&publishDateTimeTo=${bufferedEnd}`);
        const allForecasts = forecastsResponse.data.data || [];
        
        console.log(`Received ${allActuals.length} actuals and ${allForecasts.length} forecasts.`);

        const actualsMap = {};
        
        if (Array.isArray(allActuals)) {
             allActuals.forEach(item => {
                if (item.fuelType === 'WIND') {
                    // Save by string for simplicity if it matches precisely, but we'll use timestamp to be safe
                    actualsMap[new Date(item.startTime).getTime()] = item;
                }
             });
        }

        const combinedData = [];
        const targetTimeWindowStart = new Date(start).getTime();
        const targetTimeWindowEnd = new Date(end).getTime();

        const uniqueTargetTimes = Object.keys(actualsMap).map(Number).sort((a,b) => a - b);

        for (const tTime of uniqueTargetTimes) {
            // Only plot values within the exact requested UI bounds (since settlementDate gets full day)
            if (tTime >= targetTimeWindowStart && tTime <= targetTimeWindowEnd) {
                let actualItem = actualsMap[tTime];
                let matchedForecast = filterForecasts(allForecasts, actualItem.startTime, horizonHours);

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

        console.log(`Combining mapped points: ${combinedData.length}`);
        
        res.json({ data: combinedData });

    } catch (error) {
        console.error("Error fetching data:", error.message);
        // Error handling if response size exceeded or gateway timeout
        res.status(500).json({ error: 'Failed', details: error.response?.data || error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
});
