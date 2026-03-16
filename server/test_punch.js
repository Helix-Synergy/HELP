async function test() {
    try {
        const res = await fetch('http://localhost:5000/api/v1/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@helix.com', password: 'password123' })
        });
        const loginData = await res.json();
        const token = loginData.token;
        console.log('Logged in', token.substring(0, 10));
        
        const res2 = await fetch('http://localhost:5000/api/v1/attendance/punch', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
            body: JSON.stringify({})
        });
        const punchData = await res2.json();
        console.log('Punched:', punchData.message);
        
        const res3 = await fetch('http://localhost:5000/api/v1/attendance/me', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const attData = await res3.json();
        console.log('Attendance length:', attData.data.length);
        if (attData.data.length > 0) {
           console.log('Latest Attendance:', JSON.stringify(attData.data[0].punches, null, 2));
           console.log('Total Hours:', attData.data[0].totalHours);
        }
    } catch(e) {
        console.error('Error:', e.message);
    }
}
test();
