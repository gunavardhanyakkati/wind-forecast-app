const axios = require('axios');
async function test_hist() {
    try {
        console.log("Testing historical WINDFOR with settlementDateFrom...");
        const res = await axios.get('https://data.elexon.co.uk/bmrs/api/v1/datasets/WINDFOR?settlementDateFrom=2025-01-01&settlementDateTo=2025-01-02');
        console.log(`WINDFOR historical count: ${res.data.data ? res.data.data.length : 'none'}`);
        if(res.data.data && res.data.data.length > 0) console.log(res.data.data[0]);
    } catch(e) { console.error('Error:', e.message); }
}
test_hist();
