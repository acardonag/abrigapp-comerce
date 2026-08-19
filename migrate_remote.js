const { Client: SSHClient } = require('ssh2');

const config = {
    host: '5.189.167.23',
    port: 22,
    username: 'root',
    password: 'MeserIAr2026!*'
};

console.log('Connecting via SSH to run migrations...');
const conn = new SSHClient();
conn.on('ready', () => {
    console.log('SSH connection established');
    const cmd = `cd /root/abrigapp-backend && docker compose -f docker-compose.prod.yml exec -T api npm run db:migrate`;
    console.log(`Running: ${cmd}`);
    
    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        stream.on('close', (code, signal) => {
            console.log('Migration finished with code: ' + code);
            conn.end();
        }).on('data', (data) => {
            process.stdout.write(data);
        }).stderr.on('data', (data) => {
            process.stderr.write(data);
        });
    });
}).connect(config);
