const axios = require('axios');
async function testX() {
    try {
        console.log("Test WINDFOR/stream with settlementDateFrom...");
        // WINDFOR uses 'publishTime' and 'startTime' in its schema, does it accept settlementDateFrom?
        const r1 = await axios.get('https://data.elexon.co.uk/bmrs/api/v1/datasets/WINDFOR/stream?settlementDateFrom=2025-01-01&settlementDateTo=2025-01-02');
        console.log(`WINDFOR count: ${r1.data.length}`);
        if(r1.data.length > 0) console.log(r1.data[0]);

        console.log("\nTest WINDFOR with publishTimeFrom...");
        // maybe WINDFOR needs publishTimeFrom ?
        const r2 = await axios.get('https://data.elexon.co.uk/bmrs/api/v1/datasets/WINDFOR/stream?publishTimeFrom=2025-01-01T00:00:00Z&publishTimeTo=2025-01-02T00:00:00Z');
        console.log(`WINDFOR publishTimeFrom count: ${r2.data.length}`);
        if(r2.data.length > 0) console.log(r2.data[0]);
    } catch(e) { console.error('Error:', e.message); }
}
testX();
