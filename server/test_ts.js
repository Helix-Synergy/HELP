async function test() {
    try {
        const res = await fetch('http://localhost:5000/api/v1/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'employee@helix.com', password: 'Password123' })
        });
        const loginData = await res.json();
        const token = loginData.token;
        const resProj = await fetch('http://localhost:5000/api/v1/projects', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const projData = await resProj.json();
        const projId = projData.data[0]._id;
        console.log('Using project:', projId);
        const payload = {
            weekStartDate: new Date('2026-03-09T00:00:00.000Z'),
            weekEndDate: new Date('2026-03-15T23:59:59.999Z'),
            entries: [{
                project: projId,
                taskDescription: 'Test task',
                hours: { monday: 8, tuesday: 8, wednesday: 8, thursday: 0, friday: 0, saturday: 0, sunday: 0 }
            }],
            status: 'DRAFT'
        };
        const resTs = await fetch('http://localhost:5000/api/v1/timesheets', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const tsTxt = await resTs.text();
        console.log('Timesheet Create Response:', tsTxt);
    } catch(e) {
        console.error('Error:', e.message);
    }
}
test();
