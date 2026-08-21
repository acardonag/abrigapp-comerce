const { Client } = require('ssh2');
const fs = require('fs');

const sshConfig = {
    host: '5.189.167.23',
    port: 22,
    username: 'root',
    password: 'MeserIAr2026!*'
};

const conn = new Client();
conn.on('ready', () => {
    console.log('SSH connection established');
    const cmd = 'cd /root/abrigapp-backend && docker compose -f docker-compose.prod.yml exec -T api npx tsx src/db/add-category.ts';
    console.log(`Running: ${cmd}`);
    
    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        
        stream.on('close', (code, signal) => {
            console.log(`Migration script execution finished with code: ${code}`);
            conn.end();
            process.exit(code);
        }).on('data', (data) => {
            console.log(`STDOUT: ${data}`);
        }).stderr.on('data', (data) => {
            console.error(`STDERR: ${data}`);
        });
    });
}).on('error', (err) => {
    console.error('SSH Error:', err);
    process.exit(1);
}).connect(sshConfig);
