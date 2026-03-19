async function debugData() {
    try {
        const res = await fetch('http://localhost:5000/api/data?start=2025-01-01T00:00:00.000Z&end=2025-01-02T00:00:00.000Z&horizon=4');
        const data = await res.json();
        console.log(`Array Length: ${data.data.length}`);
    } catch(err) {
        console.error(err.message);
    }
}
debugData();
