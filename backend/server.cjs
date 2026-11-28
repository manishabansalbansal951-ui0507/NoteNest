const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const connectDB = require('./db.cjs');
const User = require('./models/User');
const Note = require('./models/Note');

dotenv.config();

const app = express();

app.use(cors({
    origin: [
        'http://localhost:5173',
        'https://note-nest-two-lilac.vercel.app'
    ]
}));

app.use(express.json());

const uploadsDir = path.join(__dirname, 'uploads');

if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use('/uploads', express.static(uploadsDir));

// PDF STORAGE
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },

    filename: (req, file, cb) => {
        const uniqueName = Date.now() + '-' +
            Math.round(Math.random() * 1E9) + '.pdf';

        cb(null, uniqueName);
    }
});

const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024
    },
    fileFilter: (req, file, cb) => {
        if (
            file.mimetype === 'application/pdf' &&
            path.extname(file.originalname).toLowerCase() === '.pdf'
        ) {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed!'));
        }
    }
});

// AUTHENTICATION MIDDLEWARE
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                message: 'Please login first!'
            });
        }

        const token = authHeader.split(' ')[1];

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.id).select('-password');

        if (!user) {
            return res.status(401).json({
                message: 'User not found!'
            });
        }

        req.user = user;
        next();

    } catch (error) {
        return res.status(401).json({
            message: 'Invalid or expired token!'
        });
    }
};

// HOME
app.get('/', (req, res) => {
    res.send('NoteNest MongoDB Backend Running!');
});

// REGISTER
app.post('/register', async (req, res) => {
    try {
        const { fullName, email, password } = req.body;

        if (!fullName || !email || !password) {
            return res.status(400).json({
                message: 'Please fill all fields!'
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                message: 'Password must contain at least 8 characters!'
            });
        }

        const existingUser = await User.findOne({
            email: email.toLowerCase().trim()
        });

        if (existingUser) {
            return res.status(409).json({
                message: 'Email already registered!'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const user = await User.create({
            fullName: fullName.trim(),
            email: email.toLowerCase().trim(),
            password: hashedPassword
        });

        res.status(201).json({
            message: 'Registration successful! Please login.'
        });

    } catch (error) {
        console.error('Register error:', error);

        res.status(500).json({
            message: 'Registration failed!'
        });
    }
});

// LOGIN
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: 'Email and password required!'
            });
        }

        const user = await User.findOne({
            email: email.toLowerCase().trim()
        });

        if (!user) {
            return res.status(401).json({
                message: 'Invalid email or password!'
            });
        }

        const passwordMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatch) {
            return res.status(401).json({
                message: 'Invalid email or password!'
            });
        }

        user.loginHistory.push({
            loginAt: new Date()
        });

        await user.save();

        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Login successful!',
            token,
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email
            }
        });

    } catch (error) {
        console.error('Login error:', error);

        res.status(500).json({
            message: 'Login failed!'
        });
    }
});

// GET CURRENT USER
app.get('/me', authenticate, (req, res) => {
    res.json({
        user: req.user
    });
});

// PUBLIC NOTES LIBRARY
app.get('/notes', async (req, res) => {
    try {
        const notes = await Note.find()
            .populate('uploadedBy', 'fullName')
            .sort({ createdAt: -1 });

        res.json(notes);

    } catch (error) {
        res.status(500).json({
            message: 'Unable to fetch notes!'
        });
    }
});

// INCREMENT DOWNLOAD COUNT
app.post('/notes/:id/download', async (req, res) => {
    try {
        const note = await Note.findByIdAndUpdate(
            req.params.id,
            { $inc: { downloadCount: 1 } },
            { new: true }
        );

        if (!note) {
            return res.status(404).json({
                message: 'Note not found!'
            });
        }

        res.json({
            message: 'Download count updated!',
            downloadCount: note.downloadCount
        });

    } catch (error) {
        console.error('Download count error:', error);

        res.status(500).json({
            message: 'Unable to update download count!'
        });
    }
});

// MY NOTES
app.get('/my-notes', authenticate, async (req, res) => {
    try {
        const notes = await Note.find({
            uploadedBy: req.user._id
        }).sort({ createdAt: -1 });

        res.json(notes);

    } catch (error) {
        res.status(500).json({
            message: 'Unable to fetch your notes!'
        });
    }
});

// UPLOAD PDF
app.post('/upload-note', authenticate, upload.single('file'), async (req, res) => {
    try {
        const { title, subject, description } = req.body;

        if (!title || !subject || !description || !req.file) {
            if (req.file) {
                fs.unlinkSync(req.file.path);
            }

            return res.status(400).json({
                message: 'Please fill all fields and select a PDF!'
            });
        }

        const note = await Note.create({
            title,
            subject,
            description,
            fileName: req.file.originalname,
            fileUrl: `/uploads/${req.file.filename}`,
            uploadedBy: req.user._id
        });

        res.status(201).json({
            message: 'PDF uploaded successfully!',
            note
        });

    } catch (error) {
        console.error('Upload error:', error);

        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        res.status(500).json({
            message: 'PDF upload failed!'
        });
    }
});

// EDIT NOTE
app.put('/notes/:id', authenticate, async (req, res) => {
    try {
        const note = await Note.findOne({
            _id: req.params.id,
            uploadedBy: req.user._id
        });

        if (!note) {
            return res.status(404).json({
                message: 'Note not found or access denied!'
            });
        }

        const { title, subject, description } = req.body;

        if (title !== undefined) note.title = title;
        if (subject !== undefined) note.subject = subject;
        if (description !== undefined) note.description = description;

        await note.save();

        res.json({
            message: 'Note updated successfully!',
            note
        });

    } catch (error) {
        res.status(500).json({
            message: 'Unable to update note!'
        });
    }
});

// DELETE NOTE
app.delete('/notes/:id', authenticate, async (req, res) => {
    try {
        const note = await Note.findOne({
            _id: req.params.id,
            uploadedBy: req.user._id
        });

        if (!note) {
            return res.status(404).json({
                message: 'Note not found or access denied!'
            });
        }

        const filename = path.basename(note.fileUrl);
        const filePath = path.join(uploadsDir, filename);

        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        await note.deleteOne();

        res.json({
            message: 'Note deleted successfully!'
        });

    } catch (error) {
        res.status(500).json({
            message: 'Unable to delete note!'
        });
    }
});

// ERROR HANDLER
app.use((error, req, res, next) => {
    console.error(error.message);

    res.status(400).json({
        message: error.message || 'Something went wrong!'
    });
});

// START SERVER
const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        await connectDB();

        app.listen(PORT, () => {
            console.log(`NoteNest server running on port ${PORT}`);
        });

    } catch (error) {
        console.error('Server startup failed:', error.message);
        process.exit(1);
    }
};

startServer();