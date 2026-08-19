const fs = require('fs');

async function test() {
    const formData = new FormData();
    const blob = new Blob(['test image content'], { type: 'image/png' });
    formData.append('file', blob, 'test.png');

    try {
        const res = await fetch('http://5.189.167.23:4567/api/upload', {
            method: 'POST',
            body: formData,
            headers: {
                'Authorization': 'Bearer test'
            }
        });
        console.log('Status:', res.status);
        console.log('Body:', await res.text());
    } catch (e) {
        console.error(e);
    }
}
test();
