const Client = require('ssh2-sftp-client');
const { Client: SSHClient } = require('ssh2');
const path = require('path');
const fs = require('fs');

const config = {
    host: '5.189.167.23',
    port: 22,
    username: 'root',
    password: 'MeserIAr2026!*'
};

async function uploadDir(sftp, localPath, remotePath) {
    const items = fs.readdirSync(localPath);
    for (const item of items) {
        if (item === 'node_modules' || item === 'dist' || item === '.git' || item === 'uploads') continue;
        
        const localItemPath = path.join(localPath, item);
        const remoteItemPath = remotePath + '/' + item;
        
        const stat = fs.statSync(localItemPath);
        if (stat.isDirectory()) {
            const exists = await sftp.exists(remoteItemPath);
            if (!exists) {
                await sftp.mkdir(remoteItemPath);
            }
            await uploadDir(sftp, localItemPath, remoteItemPath);
        } else {
            await sftp.fastPut(localItemPath, remoteItemPath);
            console.log(`Uploaded: ${item}`);
        }
    }
}

async function deploy() {
    const sftp = new Client();
    try {
        console.log('Connecting via SFTP...');
        await sftp.connect(config);
        console.log('Connected!');

        const remoteDir = '/root/abrigapp-backend';
        
        const exists = await sftp.exists(remoteDir);
        if (!exists) {
            await sftp.mkdir(remoteDir);
        }

        console.log('Uploading backend files...');
        await uploadDir(sftp, path.join(__dirname, 'abrigapp-backend'), remoteDir);
        console.log('Upload complete!');
        
        await sftp.end();

        console.log('Connecting via SSH to run Docker...');
        const conn = new SSHClient();
        conn.on('ready', () => {
            console.log('SSH connection established');
            
            // Execute commands on remote server
            const cmd = `if ! command -v docker &> /dev/null; then curl -fsSL https://get.docker.com | sh; fi && cd ${remoteDir} && docker compose -f docker-compose.prod.yml down || true && docker compose -f docker-compose.prod.yml up -d --build`;
            console.log(`Running: ${cmd}`);
            
            conn.exec(cmd, (err, stream) => {
                if (err) throw err;
                stream.on('close', (code, signal) => {
                    console.log('Deployment script execution finished with code: ' + code);
                    conn.end();
                }).on('data', (data) => {
                    console.log('STDOUT: ' + data);
                }).stderr.on('data', (data) => {
                    console.log('STDERR: ' + data);
                });
            });
        }).connect(config);

    } catch (err) {
        console.error(err);
    }
}

deploy();
