const axios = require('axios');
async function test() {
    try {
        const res = await axios.get('https://data.elexon.co.uk/bmrs/api/v1/datasets/FUELHH?settlementDateFrom=2025-01-01&settlementDateTo=2025-01-02');
        console.log(`Historical FUELHH count: ${res.data.data ? res.data.data.length : 'no data array'}`);
        if(res.data.data && res.data.data.length > 0) {
           console.log(res.data.data[0]);
        }
    } catch(e) { console.error('Error:', e.response ? e.response.status : e.message); }
}
test();
