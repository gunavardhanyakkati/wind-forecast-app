const axios = require('axios');

async function testApi() {
    try {
        const start = '2025-01-01T00:00:00Z';
        const end = '2025-01-01T04:00:00Z';
        // FuelHH Stream
        console.log("Fetching FUELHH...");
        const fuelHhRes = await axios.get(`https://data.elexon.co.uk/bmrs/api/v1/datasets/FUELHH/stream?publishTimeFrom=${start}&publishTimeTo=${end}`);
        const fuelHhData = fuelHhRes.data;
        const windFuel = fuelHhData.filter(d => d.fuelType === 'WIND');
        console.log("FUELHH WIND sample:", JSON.stringify(windFuel.slice(0, 2), null, 2));

        // WindFor Stream
        console.log("\nFetching WINDFOR...");
        const windForRes = await axios.get(`https://data.elexon.co.uk/bmrs/api/v1/datasets/WINDFOR/stream?publishTimeFrom=${start}&publishTimeTo=${end}`);
        const windForData = windForRes.data;
        console.log("WINDFOR sample:", JSON.stringify(windForData.slice(0, 2), null, 2));

    } catch (e) {
        console.error("Error:", e.message);
        if (e.response) {
            console.error("Response data:", e.response.data);
            console.error("Response status:", e.response.status);
        }
    }
}

testApi();
