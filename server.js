require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const complaintSchema = new mongoose.Schema({
  complaintId: { type: String, unique: true, required: true },
  studentName: { type: String, required: true, trim: true },
  department:  { type: String, required: true, trim: true },
  category:    { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Resolved'],
    default: 'Pending'
  },
  createdAt: { type: Date, default: Date.now }
});

const Complaint = mongoose.model('Complaint', complaintSchema);

async function seedDatabase() {
  const count = await Complaint.countDocuments();
  if (count > 0) return;

  await Complaint.insertMany([
    {
      complaintId: 'CMP-2026-1006',
      studentName: 'Meera Nair',
      department: 'CSE',
      category: 'Classroom Projectors',
      description: 'Projector in Lecture Hall LH-204 flickers continuously and shuts off after 10 minutes.',
      status: 'Pending'
    },
    {
      complaintId: 'CMP-2026-1005',
      studentName: 'Rohan Deshmukh',
      department: 'IT',
      category: 'Wi-Fi',
      description: "Campus Wi-Fi SSID 'EduNet-5G' drops connection every few minutes on the 3rd floor of the Central Library.",
      status: 'In Progress'
    },
    {
      complaintId: 'CMP-2026-1004',
      studentName: 'Ananya Verma',
      department: 'ECE',
      category: 'Laboratory Equipment',
      description: 'Oscilloscope #4 in Digital Electronics Lab is not powering on.',
      status: 'Resolved'
    },
    {
      complaintId: 'CMP-2026-1003',
      studentName: 'Karthik Reddy',
      department: 'Mechanical',
      category: 'Drinking Water',
      description: 'RO water cooler near Mechanical Block ground floor is dispensing warm water.',
      status: 'Pending'
    },
    {
      complaintId: 'CMP-2026-1002',
      studentName: 'Sneha Iyer',
      department: 'Civil',
      category: 'Washrooms',
      description: 'Tap leakage in 2nd-floor ladies washroom of Main Academic Block.',
      status: 'In Progress'
    },
    {
      complaintId: 'CMP-2026-1001',
      studentName: 'Vikram Singh',
      department: 'MBA',
      category: 'Hostel Maintenance',
      description: 'Corridor tube light outside Hostel B Room 312 needs replacement.',
      status: 'Resolved'
    }
  ]);
  console.log('Seeded 6 sample complaints into MongoDB.');
}

app.get('/api/complaints', async (req, res) => {
  try {
    const complaints = await Complaint.find().sort({ createdAt: -1 });
    res.json(complaints);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch complaints' });
  }
});

app.post('/api/complaints', async (req, res) => {
  try {
    const { studentName, department, category, description } = req.body;
    if (!studentName?.trim() || !department?.trim() || !category?.trim() || !description || description.trim().length < 10) {
      return res.status(400).json({ error: 'All fields are required and description must be at least 10 characters.' });
    }

    const count = await Complaint.countDocuments();
    const complaintId = `CMP-${new Date().getFullYear()}-${1001 + count + Math.floor(Math.random() * 10)}`;

    const newComplaint = await Complaint.create({
      complaintId,
      studentName: studentName.trim(),
      department: department.trim(),
      category: category.trim(),
      description: description.trim()
    });

    res.status(201).json(newComplaint);
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit complaint' });
  }
});

app.patch('/api/complaints/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['Pending', 'In Progress', 'Resolved'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    const query = mongoose.Types.ObjectId.isValid(req.params.id)
      ? { _id: req.params.id }
      : { complaintId: req.params.id };

    const updated = await Complaint.findOneAndUpdate(query, { status }, { new: true });
    if (!updated) return res.status(404).json({ error: 'Complaint not found' });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update status' });
  }
});

const PORT = process.env.PORT || 3000;
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB Atlas');
    await seedDatabase();
    app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
  })
  .catch((err) => console.error('MongoDB connection error:', err));