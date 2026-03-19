const axios = require('axios');
async function test() {
    try {
        const res = await axios.get('https://data.elexon.co.uk/bmrs/api/v1/openapi.json');
        console.log("OpenAPI string length:", JSON.stringify(res.data).length);
        const paths = res.data.paths;
        console.log(JSON.stringify(paths['/datasets/WINDFOR/stream'], null, 2));
    } catch(e) { console.error('Error:', e.message); }
}
test();
