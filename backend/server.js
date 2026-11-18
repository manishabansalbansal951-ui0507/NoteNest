import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { scryptSync, randomBytes } from 'node:crypto';
import Busboy from 'busboy';

const usersFile = path.join(process.cwd(), 'backend', 'users.json');
if (!fs.existsSync(usersFile)) {
    fs.writeFileSync(usersFile, '[]');
}
console.log("Users file location:", usersFile);
const notesFile = path.join(process.cwd(), 'backend', 'notes.json');

const uploadsDir = path.join(process.cwd(), 'backend', 'uploads');

if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

if (!fs.existsSync(notesFile)) {
    fs.writeFileSync(notesFile, '[]');
}
const server = http.createServer((req, res) => {

    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    // Registration API
    if (req.url === '/register' && req.method === 'POST') {

        let body = '';

        req.on('data', (chunk) => {
            body += chunk;
        });

        req.on('end', () => {

            try {
                const userData = JSON.parse(body);

                const users = JSON.parse(
                    fs.readFileSync(usersFile, 'utf8')
                );

                const existingUser = users.find(
                    user => user.email === userData.email
                );

                if (existingUser) {
                    res.writeHead(409, {
                        'Content-Type': 'application/json'
                    });

                    res.end(JSON.stringify({
                        message: 'Email already registered!'
                    }));

                    return;
                }

                const salt = randomBytes(16).toString('hex');

                const hashedPassword = scryptSync(
                    userData.password,
                    salt,
                    64
                ).toString('hex');

                const newUser = {
                    id: Date.now(),
                    fullName: userData.fullName,
                    email: userData.email,
                    password: hashedPassword,
                    salt: salt
                };

                users.push(newUser);

                fs.writeFileSync(
                    usersFile,
                    JSON.stringify(users, null, 2)
                );

                res.writeHead(201, {
                    'Content-Type': 'application/json'
                });

                res.end(JSON.stringify({
                    message: 'Registration successful!'
                }));

            } catch (error) {
                console.log("Registration error:", error);
                res.writeHead(500, {
                    'Content-Type': 'application/json'
                });

                res.end(JSON.stringify({
                    message: 'Registration failed!'
                }));
            }

               });

    } else if (req.url === '/login' && req.method === 'POST') {

        let body = '';

        req.on('data', (chunk) => {
            body += chunk;
        });

        req.on('end', () => {

            try {
                const loginData = JSON.parse(body);

                const users = JSON.parse(
                    fs.readFileSync(usersFile, 'utf8')
                );

                const user = users.find(
                    user => user.email === loginData.email
                );

                if (!user) {
                    res.writeHead(401, {
                        'Content-Type': 'application/json'
                    });

                    res.end(JSON.stringify({
                        message: 'Email not registered!'
                    }));

                    return;
                }

                const hashedPassword = scryptSync(
                    loginData.password,
                    user.salt,
                    64
                ).toString('hex');

                if (hashedPassword !== user.password) {
                    res.writeHead(401, {
                        'Content-Type': 'application/json'
                    });

                    res.end(JSON.stringify({
                        message: 'Incorrect password!'
                    }));

                    return;
                }

                res.writeHead(200, {
                    'Content-Type': 'application/json'
                });

                res.end(JSON.stringify({
                    message: 'Login successful!',
                    fullName: user.fullName
                }));

            } catch (error) {
                console.log('Login error:', error);

                res.writeHead(500, {
                    'Content-Type': 'application/json'
                });

                res.end(JSON.stringify({
                    message: 'Login failed!'
                }));
            }

        });

        } else if (req.url === '/upload-note' && req.method === 'POST') {

        const bb = Busboy({
            headers: req.headers,
            limits: {
                fileSize: 10 * 1024 * 1024
            }
        });

        let title = '';
        let subject = '';
        let description = '';
        let fileName = '';
        let fileReceived = false;
        let invalidFile = false;
        let fileTooLarge = false;

        bb.on('field', (name, value) => {
            if (name === 'title') title = value;
            if (name === 'subject') subject = value;
            if (name === 'description') description = value;
        });

        bb.on('file', (fieldName, file, info) => {

            const { filename, mimeType } = info;

            if (
                fieldName !== 'file' ||
                mimeType !== 'application/pdf' ||
                !filename.toLowerCase().endsWith('.pdf')
            ) {
                invalidFile = true;
                file.resume();
                return;
            }

            fileReceived = true;

            fileName = randomBytes(16).toString('hex') + '.pdf';

            const filePath = path.join(uploadsDir, fileName);

            file.on('limit', () => {
                fileTooLarge = true;
            });

            file.pipe(fs.createWriteStream(filePath));
        });

        bb.on('close', () => {

            if (!title || !subject || !description || !fileReceived) {
                res.writeHead(400, {
                    'Content-Type': 'application/json'
                });

                res.end(JSON.stringify({
                    message: 'Please provide all details and a PDF file!'
                }));
                return;
            }

            if (invalidFile || fileTooLarge) {

                if (fileName) {
                    const filePath = path.join(uploadsDir, fileName);

                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                    }
                }

                res.writeHead(400, {
                    'Content-Type': 'application/json'
                });

                res.end(JSON.stringify({
                    message: fileTooLarge
                        ? 'PDF must be smaller than 10 MB!'
                        : 'Only PDF files are allowed!'
                }));

                return;
            }

            const notes = JSON.parse(
                fs.readFileSync(notesFile, 'utf8')
            );

            const newNote = {
                id: Date.now(),
                title,
                subject,
                description,
                fileName
            };

            notes.push(newNote);

            fs.writeFileSync(
                notesFile,
                JSON.stringify(notes, null, 2)
            );

            res.writeHead(201, {
                'Content-Type': 'application/json'
            });

            res.end(JSON.stringify({
                message: 'PDF uploaded successfully!',
                note: newNote
            }));

        });

        bb.on('error', (error) => {
            console.log('Upload error:', error);

            if (!res.headersSent) {
                res.writeHead(500, {
                    'Content-Type': 'application/json'
                });

                res.end(JSON.stringify({
                    message: 'PDF upload failed!'
                }));
            }
        });

        req.pipe(bb);

        } else if (req.url === '/notes' && req.method === 'GET') {

    const notes = JSON.parse(
        fs.readFileSync(notesFile, 'utf8')
    );

    res.writeHead(200, {
        'Content-Type': 'application/json'
    });

    res.end(JSON.stringify(notes));

           
const usersFile = path.join(process.cwd(), 'backend', 'users.json');
if (!fs.existsSync(usersFile)) {
    fs.writeFileSync(usersFile, '[]');
}
console.log("Users file location:", usersFile);
const notesFile = path.join(process.cwd(), 'backend', 'notes.json');

const uploadsDir = path.join(process.cwd(), 'backend', 'uploads');

if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

if (!fs.existsSync(notesFile)) {
    fs.writeFileSync(notesFile, '[]');
}
const server = http.createServer((req, res) => {

    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    // Registration API
    if (req.url === '/register' && req.method === 'POST') {

        let body = '';

        req.on('data', (chunk) => {
            body += chunk;
        });

        req.on('end', () => {

            try {
                const userData = JSON.parse(body);

                const users = JSON.parse(
                    fs.readFileSync(usersFile, 'utf8')
                );

                const existingUser = users.find(
                    user => user.email === userData.email
                );

                if (existingUser) {
                    res.writeHead(409, {
                        'Content-Type': 'application/json'
                    });

                    res.end(JSON.stringify({
                        message: 'Email already registered!'
                    }));

                    return;
                }

                const salt = randomBytes(16).toString('hex');

                const hashedPassword = scryptSync(
                    userData.password,
                    salt,
                    64
                ).toString('hex');

                const newUser = {
                    id: Date.now(),
                    fullName: userData.fullName,
                    email: userData.email,
                    password: hashedPassword,
                    salt: salt
                };

                users.push(newUser);

                fs.writeFileSync(
                    usersFile,
                    JSON.stringify(users, null, 2)
                );

                res.writeHead(201, {
                    'Content-Type': 'application/json'
                });

                res.end(JSON.stringify({
                    message: 'Registration successful!'
                }));

            } catch (error) {
                console.log("Registration error:", error);
                res.writeHead(500, {
                    'Content-Type': 'application/json'
                });

                res.end(JSON.stringify({
                    message: 'Registration failed!'
                }));
            }

               });

    } else if (req.url === '/login' && req.method === 'POST') {

        let body = '';

        req.on('data', (chunk) => {
            body += chunk;
        });

        req.on('end', () => {

            try {
                const loginData = JSON.parse(body);

                const users = JSON.parse(
                    fs.readFileSync(usersFile, 'utf8')
                );

                const user = users.find(
                    user => user.email === loginData.email
                );

                if (!user) {
                    res.writeHead(401, {
                        'Content-Type': 'application/json'
                    });

                    res.end(JSON.stringify({
                        message: 'Email not registered!'
                    }));

                    return;
                }

                const hashedPassword = scryptSync(
                    loginData.password,
                    user.salt,
                    64
                ).toString('hex');

                if (hashedPassword !== user.password) {
                    res.writeHead(401, {
                        'Content-Type': 'application/json'
                    });

                    res.end(JSON.stringify({
                        message: 'Incorrect password!'
                    }));

                    return;
                }

                res.writeHead(200, {
                    'Content-Type': 'application/json'
                });

                res.end(JSON.stringify({
                    message: 'Login successful!',
                    fullName: user.fullName
                }));

            } catch (error) {
                console.log('Login error:', error);

                res.writeHead(500, {
                    'Content-Type': 'application/json'
                });

                res.end(JSON.stringify({
                    message: 'Login failed!'
                }));
            }

        });

        } else if (req.url === '/upload-note' && req.method === 'POST') {

        const bb = Busboy({
            headers: req.headers,
            limits: {
                fileSize: 10 * 1024 * 1024
            }
        });

        let title = '';
        let subject = '';
        let description = '';
        let fileName = '';
        let fileReceived = false;
        let invalidFile = false;
        let fileTooLarge = false;

        bb.on('field', (name, value) => {
            if (name === 'title') title = value;
            if (name === 'subject') subject = value;
            if (name === 'description') description = value;
        });

        bb.on('file', (fieldName, file, info) => {

            const { filename, mimeType } = info;

            if (
                fieldName !== 'file' ||
                mimeType !== 'application/pdf' ||
                !filename.toLowerCase().endsWith('.pdf')
            ) {
                invalidFile = true;
                file.resume();
                return;
            }

            fileReceived = true;

            fileName = randomBytes(16).toString('hex') + '.pdf';

            const filePath = path.join(uploadsDir, fileName);

            file.on('limit', () => {
                fileTooLarge = true;
            });

            file.pipe(fs.createWriteStream(filePath));
        });

        bb.on('close', () => {

            if (!title || !subject || !description || !fileReceived) {
                res.writeHead(400, {
                    'Content-Type': 'application/json'
                });

                res.end(JSON.stringify({
                    message: 'Please provide all details and a PDF file!'
                }));
                return;
            }

            if (invalidFile || fileTooLarge) {

                if (fileName) {
                    const filePath = path.join(uploadsDir, fileName);

                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                    }
                }

                res.writeHead(400, {
                    'Content-Type': 'application/json'
                });

                res.end(JSON.stringify({
                    message: fileTooLarge
                        ? 'PDF must be smaller than 10 MB!'
                        : 'Only PDF files are allowed!'
                }));

                return;
            }

            const notes = JSON.parse(
                fs.readFileSync(notesFile, 'utf8')
            );

            const newNote = {
                id: Date.now(),
                title,
                subject,
                description,
                fileName
            };

            notes.push(newNote);

            fs.writeFileSync(
                notesFile,
                JSON.stringify(notes, null, 2)
            );

            res.writeHead(201, {
                'Content-Type': 'application/json'
            });

            res.end(JSON.stringify({
                message: 'PDF uploaded successfully!',
                note: newNote
            }));

        });

        bb.on('error', (error) => {
            console.log('Upload error:', error);

            if (!res.headersSent) {
                res.writeHead(500, {
                    'Content-Type': 'application/json'
                });

                res.end(JSON.stringify({
                    message: 'PDF upload failed!'
                }));
            }
        });

        req.pipe(bb);

        } else if (req.url === '/notes' && req.method === 'GET') {

    const notes = JSON.parse(
        fs.readFileSync(notesFile, 'utf8')
    );

    res.writeHead(200, {
        'Content-Type': 'application/json'
    });

    res.end(JSON.stringify(notes));

             } else if (req.url.startsWith('/notes/') && req.method === 'DELETE') {

            const noteId = req.url.split('/')[2];

            const notes = JSON.parse(
                fs.readFileSync(notesFile, 'utf8')
            );

            const noteToDelete = notes.find(
                (note) => String(note.id) === noteId
            );

            if (!noteToDelete) {
                res.writeHead(404, {
                    'Content-Type': 'application/json'
                });

                res.end(JSON.stringify({
                    message: 'Note not found!'
                }));

                return;
            }

            const updatedNotes = notes.filter(
                (note) => String(note.id) !== noteId
            );

            fs.writeFileSync(
                notesFile,
                JSON.stringify(updatedNotes, null, 2)
            );

            if (noteToDelete.fileName) {
                const filePath = path.join(
                    uploadsDir,
                    path.basename(noteToDelete.fileName)
                );

                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            }

            res.writeHead(200, {
                'Content-Type': 'application/json'
            });

            res.end(JSON.stringify({
                message: 'Note deleted successfully!'
            }));
   } else if (req.url.startsWith('/uploads/') && req.method === 'GET') {

    const fileName = path.basename(
        decodeURIComponent(req.url.split('?')[0].replace('/uploads/', ''))
    );

    const filePath = path.join(uploadsDir, fileName);

    if (!fileName.endsWith('.pdf') || !fs.existsSync(filePath)) {
        res.writeHead(404);
        res.end('PDF not found!');
        return;
    }

    const isDownload = req.url.includes('download=true');

res.writeHead(200, {
    'Content-Type': 'application/pdf',
    'Content-Disposition': isDownload
        ? 'attachment'
        : 'inline'
});

    fs.createReadStream(filePath).pipe(res);

        } else {

            res.writeHead(200, {
                'Content-Type': 'text/plain'
            });

            res.end('Welcome to NoteNest Backend!');

        }

        });

server.listen(process.env.PORT || 5000, () => {
    console.log(`Server is running on port ${process.env.PORT || 5000}`);
});

             } else if (req.url.startsWith('/notes/') && req.method === 'DELETE') {

            const noteId = req.url.split('/')[2];

            const notes = JSON.parse(
                fs.readFileSync(notesFile, 'utf8')
            );

            const noteToDelete = notes.find(
                (note) => String(note.id) === noteId
            );

            if (!noteToDelete) {
                res.writeHead(404, {
                    'Content-Type': 'application/json'
                });

                res.end(JSON.stringify({
                    message: 'Note not found!'
                }));

                return;
            }

            const updatedNotes = notes.filter(
                (note) => String(note.id) !== noteId
            );

            fs.writeFileSync(
                notesFile,
                JSON.stringify(updatedNotes, null, 2)
            );

            if (noteToDelete.fileName) {
                const filePath = path.join(
                    uploadsDir,
                    path.basename(noteToDelete.fileName)
                );

                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            }

            res.writeHead(200, {
                'Content-Type': 'application/json'
            });

            res.end(JSON.stringify({
                message: 'Note deleted successfully!'
            }));
   } else if (req.url.startsWith('/uploads/') && req.method === 'GET') {

    const fileName = path.basename(
        decodeURIComponent(req.url.split('?')[0].replace('/uploads/', ''))
    );

    const filePath = path.join(uploadsDir, fileName);

    if (!fileName.endsWith('.pdf') || !fs.existsSync(filePath)) {
        res.writeHead(404);
        res.end('PDF not found!');
        return;
    }

    const isDownload = req.url.includes('download=true');

res.writeHead(200, {
    'Content-Type': 'application/pdf',
    'Content-Disposition': isDownload
        ? 'attachment'
        : 'inline'
});

    fs.createReadStream(filePath).pipe(res);

} else {

    res.writeHead(200, {
        'Content-Type': 'text/plain'
    });

    res.end('Welcome to NoteNest Backend!');

}

});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});