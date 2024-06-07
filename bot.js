const { Client } = require('whatsapp-web.js');
const { BaileysClass } = require('@bot-wa/bot-wa-baileys');
const mysql = require('mysql');
const qrcode = require('qrcode-terminal');

// MySQL Database connection setup
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'new'
});

connection.connect((err) => {
    if (err) {
        console.error('Error connecting to database:', err);
        return;
    }
    console.log('Connected to database!');

    const createTableQuery = `CREATE TABLE IF NOT EXISTS playerucp (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ucp VARCHAR(22),
        verifycode INT,
        discordid BIGINT,
        password VARCHAR(64),
        salt VARCHAR(16),
        extrac INT,
        pass_web VARCHAR(255),
        email VARCHAR(255),
        nomor VARCHAR(20)
    )`;

    connection.query(createTableQuery, (err, result) => {
        if (err) {
            console.error('Error creating table:', err);
            return;
        }
        console.log('Table playerucp created successfully!');
    });
});

// WhatsApp Web.js setup
const client = new Client();

client.on('qr', (qrCode) => {
    console.log('QR Code Received:');
    qrcode.generate(qrCode, { small: true });
});

client.on('ready', () => {
    console.log('WhatsApp Bot is ready!');
});

client.on('message', async (msg) => {
    const args = msg.body.split(' ');
    const command = args.shift().toLowerCase();

    if (command === 'ucp') {
        if (args.length === 0) {
            // Menampilkan format yang benar ketika tidak ada argumen
            msg.reply('Format yang benar: ```ucp [PlayerName]```. PlayerName harus diawali huruf besar dan memiliki minimal 4 karakter.');
            return;
        }

        const action = args.shift().toLowerCase();
        const playerName = args.join(' ');

        // Memeriksa tindakan apa yang diminta
        if (action === 'create') {
            // Memeriksa apakah nama pemain memenuhi kriteria
            if (/^[A-Z][a-zA-Z]{3,}$/.test(playerName)) {
                // Insert new player into database
                const verifyCode = generateVerifyCode();
                connection.query('INSERT INTO playerucp (ucp, verifycode, nomor) VALUES (?, ?, ?)', [playerName, verifyCode, msg.from], (err, result) => {
                    if (err) {
                        console.error('Error inserting player:', err);
                        return;
                    }
                    console.log(`New player added: ${playerName}`);
                    msg.reply(`Player ${playerName} added. Verification code: ${verifyCode}`);
                });
            } else {
                msg.reply('Invalid player name format. Player name must start with uppercase letter and have at least 4 characters.');
            }
        } else if (action === 'delete') {
            // Menghapus pemain dari database
            connection.query('DELETE FROM playerucp WHERE ucp = ?', [playerName], (err, result) => {
                if (err) {
                    console.error('Error deleting player:', err);
                    return;
                }
                console.log(`Player ${playerName} deleted.`);
                msg.reply(`Player ${playerName} deleted.`);
            });
        } else {
            msg.reply('Invalid action. Available actions: create, delete.');
        }
    }
});

// Baileys setup
const botBaileys = new BaileysClass({ usePairingCode: true, phoneNumber: 'XXXXXXXXXXX' });

botBaileys.on('auth_failure', async (error) => console.log("ERROR BOT: ", error));
botBaileys.on('pairing_code', (code) => console.log("NEW PAIRING CODE: ", code));
botBaileys.on('ready', async () => console.log('READY BOT'));

let awaitingResponse = false;

botBaileys.on('message', async (message) => {
    if (!awaitingResponse) {
        await botBaileys.sendPoll(message.from, 'Select an option', {
            options: ['text', 'media', 'file', 'sticker'],
            multiselect: false
        });
        awaitingResponse = true;
    } else {
        const command = message.body.toLowerCase().trim();
        switch (command) {
            case 'text':
                await botBaileys.sendText(message.from, 'Hello world');
                break;
            case 'media':
                await botBaileys.sendMedia(message.from, 'https://www.w3schools.com/w3css/img_lights.jpg', 'Hello world');
                break;
            case 'file':
                await botBaileys.sendFile(message.from, 'https://github.com/pedrazadixon/sample-files/raw/main/sample_pdf.pdf');
                break;
            case 'sticker':
                await botBaileys.sendSticker(message.from, 'https://gifimgs.com/animations/anime/dragon-ball-z/Goku/goku_34.gif', { pack: 'User', author: 'Me' });
                break;
            default:
                await botBaileys.sendText(message.from, 'Sorry, I did not understand that command. Please select an option from the poll.');
                break;
        }
        awaitingResponse = false;
    }
});

// Initialize both clients
client.initialize();
botBaileys.initialize();

function generateVerifyCode() {
    return Math.floor(10000 + Math.random() * 90000);
}
