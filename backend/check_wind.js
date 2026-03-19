const axios = require('axios');
async function test_time() {
    try {
        const url = 'https://data.elexon.co.uk/bmrs/api/v1/datasets/WINDFOR?publishDateTimeFrom=2025-01-01T00:00:00Z&publishDateTimeTo=2025-01-02T00:00:00Z';
        console.log(`Testing WINDFOR with publishDateTimeFrom...`);
        const res = await axios.get(url);
        console.log(`Count: ${res.data.data ? res.data.data.length : res.data.length}`);
        if(res.data.data && res.data.data.length > 0) {
            console.log(res.data.data.slice(0, 2).map(d => `${d.startTime} (pub: ${d.publishTime})`));
        }
    } catch(e) { console.error('Error:', e.response ? e.response.status : e.message); }
}
test_time();
