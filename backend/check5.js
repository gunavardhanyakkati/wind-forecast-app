const axios = require('axios');
async function test() {
    console.log("Testing historical WINDFOR with publishTimeFrom...");
    const res2 = await axios.get('https://data.elexon.co.uk/bmrs/api/v1/datasets/WINDFOR?publishTimeFrom=2025-01-01T00:00:00Z&publishTimeTo=2025-01-02T00:00:00Z');
    if(res2.data.data && res2.data.data.length > 0) console.log(res2.data.data[0]);
}
test();
