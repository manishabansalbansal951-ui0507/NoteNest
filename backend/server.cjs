const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { scryptSync, randomBytes, timingSafeEqual } = require('crypto');
const Busboy = require('busboy');

// FILE PATHS
const backendDir = path.join(process.cwd(), 'backend');
const usersFile = path.join(backendDir, 'users.json');
const notesFile = path.join(backendDir, 'notes.json');
const uploadsDir = path.join(backendDir, 'uploads');

// CREATE REQUIRED FILES AND FOLDERS
if (!fs.existsSync(backendDir)) {
    fs.mkdirSync(backendDir, { recursive: true });
}

if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

if (!fs.existsSync(usersFile)) {
    fs.writeFileSync(usersFile, '[]');
}

if (!fs.existsSync(notesFile)) {
    fs.writeFileSync(notesFile, '[]');
}

// HELPER FUNCTIONS
function readJSON(file) {
    try {
        return JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch {
        return [];
    }
}

function saveJSON(file, data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function sendJSON(res, statusCode, data) {
    res.writeHead(statusCode, {
        'Content-Type': 'application/json'
    });
    res.end(JSON.stringify(data));
}

function getRequestBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';

        req.on('data', chunk => {
            body += chunk;
        });

        req.on('end', () => {
            try {
                resolve(JSON.parse(body || '{}'));
            } catch (error) {
                reject(error);
            }
        });

        req.on('error', reject);
    });
}

// CREATE SERVER
const server = http.createServer(async (req, res) => {

    // CORS
    const allowedOrigins = [
        'http://localhost:5173',
        'https://note-nest-two-lilac.vercel.app'
    ];

    const origin = req.headers.origin;

    if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }

    res.setHeader('Vary', 'Origin');
    res.setHeader(
        'Access-Control-Allow-Methods',
        'GET, POST, PUT, DELETE, OPTIONS'
    );
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    const url = new URL(req.url, 'http://localhost');
    const pathname = url.pathname;

    try {

        // HOME ROUTE
        if (req.method === 'GET' && pathname === '/') {
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end('NoteNest Backend is Running!');
            return;
        }

        // REGISTER
        if (req.method === 'POST' && pathname === '/register') {

            const { fullName, email, password } = await getRequestBody(req);

            if (!fullName || !email || !password) {
                sendJSON(res, 400, {
                    message: 'Please fill all fields.'
                });
                return;
            }

            const users = readJSON(usersFile);

            const existingUser = users.find(
                user => user.email.toLowerCase() === email.toLowerCase()
            );

            if (existingUser) {
                sendJSON(res, 409, {
                    message: 'Email already registered.'
                });
                return;
            }

            const salt = randomBytes(16).toString('hex');

            const hashedPassword = scryptSync(
                password,
                salt,
                64
            ).toString('hex');

            const newUser = {
                id: crypto.randomUUID(),
                fullName,
                email,
                salt,
                password: hashedPassword
            };

            users.push(newUser);
            saveJSON(usersFile, users);

            sendJSON(res, 201, {
                message: 'Registration successful!',
                user: {
                    id: newUser.id,
                    fullName: newUser.fullName,
                    email: newUser.email
                }
            });

            return;
        }

        // LOGIN
        if (req.method === 'POST' && pathname === '/login') {

            const { email, password } = await getRequestBody(req);

            const users = readJSON(usersFile);

            const user = users.find(
                item => item.email.toLowerCase() === (email || '').toLowerCase()
            );

            if (!user) {
                sendJSON(res, 401, {
                    message: 'Invalid email or password.'
                });
                return;
            }

            const hashedPassword = scryptSync(
                password,
                user.salt,
                64
            );

            const storedPassword = Buffer.from(user.password, 'hex');

            if (
                hashedPassword.length !== storedPassword.length ||
                !timingSafeEqual(hashedPassword, storedPassword)
            ) {
                sendJSON(res, 401, {
                    message: 'Invalid email or password.'
                });
                return;
            }
                
            if (!user.loginHistory) {
                        user.loginHistory = [];
                    }

                    user.loginHistory.push({
                        email: user.email,
                        loginAt: new Date().toISOString()
                    });

                    saveJSON(usersFile, users);

            sendJSON(res, 200, {
                message: 'Login successful!',
                user: {
                    id: user.id,
                    fullName: user.fullName,
                    email: user.email
                }
            });

            return;
        }

        // UPLOAD NOTE
        if (req.method === 'POST' && pathname === '/upload-note') {

            let fields = {};
            let uploadedFileName = null;
            let uploadError = null;
            let fileWritePromise = Promise.resolve();

            let busboy;

            try {
                busboy = Busboy({
                    headers: req.headers,
                    limits: {
                        fileSize: 10 * 1024 * 1024,
                        files: 1
                    }
                });
            } catch (error) {
                sendJSON(res, 400, {
                    message: 'Invalid upload request.'
                });
                return;
            }

            busboy.on('field', (fieldName, value) => {
                fields[fieldName] = value;
            });

            busboy.on('file', (fieldName, file, info) => {

                const originalName = info.filename || '';
                const mimeType = info.mimeType || '';

                if (
                    mimeType !== 'application/pdf' ||
                    path.extname(originalName).toLowerCase() !== '.pdf'
                ) {
                    uploadError = 'Only PDF files are allowed.';
                    file.resume();
                    return;
                }

                uploadedFileName =
                    `${crypto.randomUUID()}.pdf`;

                const filePath = path.join(
                    uploadsDir,
                    uploadedFileName
                );

                const writeStream = fs.createWriteStream(filePath);

                fileWritePromise = new Promise((resolve, reject) => {
                    writeStream.on('finish', resolve);
                    writeStream.on('error', reject);
                });

                file.on('limit', () => {
                    uploadError = 'File size must not exceed 10MB.';
                });

                file.pipe(writeStream);
            });

            busboy.on('error', () => {
                uploadError = 'File upload failed.';
            });

            busboy.on('close', async () => {

                try {
                    await fileWritePromise;

                    if (uploadError) {
                        if (uploadedFileName) {
                            const filePath = path.join(
                                uploadsDir,
                                uploadedFileName
                            );

                            if (fs.existsSync(filePath)) {
                                fs.unlinkSync(filePath);
                            }
                        }

                        sendJSON(res, 400, {
                            message: uploadError
                        });
                        return;
                    }

                    if (!uploadedFileName) {
                        sendJSON(res, 400, {
                            message: 'Please select a PDF file.'
                        });
                        return;
                    }

                    if (!fields.title || !fields.subject) {
                        fs.unlinkSync(
                            path.join(uploadsDir, uploadedFileName)
                        );

                        sendJSON(res, 400, {
                            message: 'Title and subject are required.'
                        });
                        return;
                    }

                    const notes = readJSON(notesFile);

                    const newNote = {
                        id: crypto.randomUUID(),
                        userId: fields.userId || null,
                        title: fields.title,
                        subject: fields.subject,
                        description: fields.description || '',
                        fileName: uploadedFileName,
                        createdAt: new Date().toISOString()
                    };

                    notes.push(newNote);
                    saveJSON(notesFile, notes);

                    sendJSON(res, 201, {
                        message: 'Note uploaded successfully!',
                        note: newNote
                    });

                } catch (error) {
                    console.error('Upload error:', error);

                    sendJSON(res, 500, {
                        message: 'Unable to save uploaded note.'
                    });
                }
            });

            req.pipe(busboy);
            return;
        }

       // GET USER NOTES
        if (req.method === 'GET' && pathname === '/notes') {

            const userId = new URL(req.url, 'http://localhost').searchParams.get('userId');

            const notes = readJSON(notesFile);

            const userNotes = notes.filter(
                note => note.userId === userId
            );

            sendJSON(res, 200, userNotes);
            return;
        }

        // EDIT NOTE
        if (req.method === 'PUT' && pathname.startsWith('/notes/')) {

            const noteId = pathname.split('/')[2];
            const updatedData = await getRequestBody(req);

            const notes = readJSON(notesFile);

            const noteIndex = notes.findIndex(
                note => String(note.id) === noteId
            );

            if (noteIndex === -1) {
                sendJSON(res, 404, {
                    message: 'Note not found.'
                });
                return;
            }

            notes[noteIndex] = {
                ...notes[noteIndex],
                title: updatedData.title ?? notes[noteIndex].title,
                subject: updatedData.subject ?? notes[noteIndex].subject,
                description:
                    updatedData.description ?? notes[noteIndex].description
            };

            saveJSON(notesFile, notes);

            sendJSON(res, 200, {
                message: 'Note updated successfully!',
                note: notes[noteIndex]
            });

            return;
        }

        // DELETE NOTE
        if (req.method === 'DELETE' && pathname.startsWith('/notes/')) {

            const noteId = pathname.split('/')[2];

            const notes = readJSON(notesFile);

            const note = notes.find(
                item => String(item.id) === noteId
            );

            if (!note) {
                sendJSON(res, 404, {
                    message: 'Note not found.'
                });
                return;
            }

            const updatedNotes = notes.filter(
                item => String(item.id) !== noteId
            );

            saveJSON(notesFile, updatedNotes);

            if (note.fileName) {
                const filePath = path.join(
                    uploadsDir,
                    path.basename(note.fileName)
                );

                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            }

            sendJSON(res, 200, {
                message: 'Note deleted successfully!'
            });

            return;
        }

        // VIEW / DOWNLOAD PDF
        if (req.method === 'GET' && pathname.startsWith('/uploads/')) {

            const fileName = path.basename(
                decodeURIComponent(pathname.split('/').pop())
            );

            if (path.extname(fileName).toLowerCase() !== '.pdf') {
                sendJSON(res, 400, {
                    message: 'Invalid file.'
                });
                return;
            }

            const filePath = path.join(uploadsDir, fileName);

            if (!fs.existsSync(filePath)) {
                sendJSON(res, 404, {
                    message: 'File not found.'
                });
                return;
            }

            const download = url.searchParams.get('download') === 'true';

            res.writeHead(200, {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `${download ? 'attachment' : 'inline'}; filename="${fileName}"`
            });

            const fileStream = fs.createReadStream(filePath);

            fileStream.on('error', () => {
                if (!res.headersSent) {
                    sendJSON(res, 500, {
                        message: 'Unable to open file.'
                    });
                } else {
                    res.destroy();
                }
            });

            fileStream.pipe(res);
            return;
        }

        // ROUTE NOT FOUND
        sendJSON(res, 404, {
            message: 'Route not found.'
        });

    } catch (error) {
        console.error('Server error:', error);

        if (!res.headersSent) {
            sendJSON(res, 500, {
                message: 'Internal server error.'
            });
        }
    }
});

// START SERVER
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

