const axios = require('axios');

async function check() {
    try {
        const start = '2025-01-01T00:00:00.000Z';
        const end = '2025-01-02T00:00:00.000Z';
        const actualsResponse = await axios.get(`https://data.elexon.co.uk/bmrs/api/v1/datasets/FUELHH/stream?publishTimeFrom=${start}&publishTimeTo=${end}`);
        const windActuals = actualsResponse.data.filter(d => d.fuelType === 'WIND');
        console.log(`WIND Actuals length: ${windActuals.length}`);
        if(windActuals.length > 0) {
            console.log(`Sample Actual:`, windActuals[0]);
        }
    } catch(e) { console.error(e.message); }
}
check();
