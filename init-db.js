const { Client: SSHClient } = require('ssh2');

const config = {
    host: '5.189.167.23',
    port: 22,
    username: 'root',
    password: 'MeserIAr2026!*'
};

const conn = new SSHClient();
conn.on('ready', () => {
    console.log('SSH connection established');
    const cmd = `docker exec abrigapp-backend-api-1 npm run db:migrate && docker exec abrigapp-backend-api-1 npm run db:seed`;
    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        stream.on('close', (code, signal) => {
            console.log('DB Init finished with code: ' + code);
            conn.end();
        }).on('data', (data) => {
            console.log('STDOUT: ' + data);
        }).stderr.on('data', (data) => {
            console.log('STDERR: ' + data);
        });
    });
}).connect(config);
