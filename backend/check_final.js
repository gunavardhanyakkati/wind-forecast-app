const axios = require('axios');
async function test_final() {
    try {
        const start = '2025-01-01';
        const end = '2025-01-02';
        console.log("Fetching Actuals...");
        const resA = await axios.get(`https://data.elexon.co.uk/bmrs/api/v1/datasets/FUELHH?settlementDateFrom=${start}&settlementDateTo=${end}`);
        console.log(`Actuals count: ${resA.data.data.length}`);
        
        console.log("Fetching Forecasts...");
        const resF = await axios.get(`https://data.elexon.co.uk/bmrs/api/v1/datasets/WINDFOR?settlementDateFrom=${start}&settlementDateTo=${end}`);
        console.log(`Forecasts count: ${resF.data.data.length}`);
        
        // Find if we have multiple forecasts for a single target time
        if(resF.data.data.length > 0) {
            const firstTarget = resF.data.data[0].startTime;
            const matches = resF.data.data.filter(d => d.startTime === firstTarget);
            console.log(`Found ${matches.length} forecasts for targetTime ${firstTarget}`);
            matches.forEach(m => console.log(`  - published at: ${m.publishTime}, gen: ${m.generation}`));
        }
    } catch(e) { console.error('Error:', e.message); }
}
test_final();
