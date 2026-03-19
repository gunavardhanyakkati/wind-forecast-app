async function testApi() {
    try {
        console.log("Testing stream with publishTimeFrom...");
        const res1 = await fetch('https://data.elexon.co.uk/bmrs/api/v1/datasets/FUELHH/stream?publishTimeFrom=2025-01-01T00:00:00Z&publishTimeTo=2025-01-02T00:00:00Z');
        const d1 = await res1.json();
        console.log(`Length 1: ${d1.length}`);
        if(d1.length > 0) console.log(d1[0]);

        console.log("Testing stream with settlementDateFrom...");
        const res2 = await fetch('https://data.elexon.co.uk/bmrs/api/v1/datasets/FUELHH/stream?settlementDateFrom=2025-01-01&settlementDateTo=2025-01-02');
        const d2 = await res2.json();
        console.log(`Length 2: ${d2.length}`);
        if(d2.length > 0) console.log(d2[0]);

    } catch (e) {
        console.error(e.message);
    }
}
testApi();
