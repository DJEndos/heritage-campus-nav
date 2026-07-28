/**
 * Seed script - populates the database with an admin account and a sample
 * schematic layout of Heritage Polytechnic campus (locations + connecting paths).
 *
 * Run with: npm run seed
 */
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Location = require('../models/Location');
const Edge = require('../models/Edge');

const locationsData = [
  { name: 'Main Gate', code: 'GATE-01', category: 'Gate', x: 50, y: 97, description: 'Primary entrance to Heritage Polytechnic campus.' },
  { name: 'Senate Building', code: 'ADM-01', category: 'Administration', x: 50, y: 78, description: 'Houses the Rector\'s office and central administration.' },
  { name: 'Bursary', code: 'ADM-02', category: 'Administration', x: 62, y: 78, description: 'Student fees and payment processing office.' },
  { name: 'School of Engineering', code: 'SOE-01', category: 'Academic', x: 25, y: 60, description: 'Department of Engineering programs and laboratories.' },
  { name: 'School of Business Studies', code: 'SBS-01', category: 'Academic', x: 40, y: 55, description: 'Department of Business and Management programs.' },
  { name: 'School of Science & Technology', code: 'SST-01', category: 'Academic', x: 60, y: 55, description: 'Department of Science and Applied Technology.' },
  { name: 'ICT Center', code: 'ICT-01', category: 'Facility', x: 75, y: 60, description: 'Central computer labs and campus network hub.' },
  { name: 'Library Complex', code: 'LIB-01', category: 'Facility', x: 50, y: 62, description: 'Main library with reading rooms and e-resources center.' },
  { name: 'Auditorium', code: 'AUD-01', category: 'Facility', x: 35, y: 70, description: 'Main hall used for lectures, seminars, and matriculation.' },
  { name: 'Male Hostel', code: 'HOS-01', category: 'Hostel', x: 15, y: 30, description: 'On-campus accommodation for male students.' },
  { name: 'Female Hostel', code: 'HOS-02', category: 'Hostel', x: 85, y: 30, description: 'On-campus accommodation for female students.' },
  { name: 'Health Center', code: 'HLT-01', category: 'Health', x: 65, y: 40, description: 'Campus clinic providing first aid and basic medical care.' },
  { name: 'Cafeteria', code: 'FAC-01', category: 'Facility', x: 50, y: 45, description: 'Main student cafeteria and food court.' },
  { name: 'Sports Complex', code: 'REC-01', category: 'Recreation', x: 25, y: 20, description: 'Football pitch, courts, and gymnasium.' },
  { name: 'Student Center', code: 'FAC-02', category: 'Recreation', x: 60, y: 20, description: 'Student union building and common recreation space.' },
  { name: 'Car Park A', code: 'PRK-01', category: 'Parking', x: 40, y: 90, description: 'Main visitor and staff car park near the entrance.' },
];

// Connections describing which locations have a direct walkway between them.
// Distances are approximate meters for demo purposes.
const edgesData = [
  ['Main Gate', 'Car Park A', 60],
  ['Main Gate', 'Senate Building', 220],
  ['Car Park A', 'Senate Building', 200],
  ['Senate Building', 'Bursary', 90],
  ['Senate Building', 'Auditorium', 180],
  ['Senate Building', 'Library Complex', 170],
  ['Auditorium', 'School of Business Studies', 150],
  ['Auditorium', 'School of Engineering', 260],
  ['Library Complex', 'School of Business Studies', 130],
  ['Library Complex', 'School of Science & Technology', 140],
  ['Library Complex', 'ICT Center', 220],
  ['Library Complex', 'Cafeteria', 160],
  ['School of Science & Technology', 'ICT Center', 160],
  ['School of Engineering', 'Male Hostel', 320],
  ['School of Business Studies', 'Cafeteria', 150],
  ['ICT Center', 'Female Hostel', 300],
  ['ICT Center', 'Health Center', 190],
  ['Cafeteria', 'Health Center', 150],
  ['Cafeteria', 'Male Hostel', 360],
  ['Cafeteria', 'Female Hostel', 340],
  ['Male Hostel', 'Sports Complex', 130],
  ['Female Hostel', 'Student Center', 130],
  ['Health Center', 'Student Center', 210],
  ['Sports Complex', 'School of Engineering', 300],
  ['Student Center', 'School of Science & Technology', 300],
];

const seed = async () => {
  try {
    await connectDB();

    console.log('Clearing existing data...');
    await Promise.all([Location.deleteMany({}), Edge.deleteMany({})]);

    // Admin account - only created if it doesn't already exist
    let admin = await User.findOne({ email: process.env.ADMIN_EMAIL });
    if (!admin) {
      admin = await User.create({
        name: process.env.ADMIN_NAME || 'Campus Admin',
        email: process.env.ADMIN_EMAIL || 'admin@heritagepoly.edu.ng',
        password: process.env.ADMIN_PASSWORD || 'ChangeMe123!',
        role: 'admin',
      });
      console.log(`Admin account created: ${admin.email}`);
    } else {
      console.log(`Admin account already exists: ${admin.email}`);
    }

    console.log('Seeding locations...');
    const createdLocations = await Location.insertMany(
      locationsData.map((loc) => ({ ...loc, createdBy: admin._id }))
    );

    const nameToId = new Map(createdLocations.map((l) => [l.name, l._id]));

    console.log('Seeding paths (edges)...');
    const edgeDocs = edgesData
      .map(([fromName, toName, distance]) => {
        const from = nameToId.get(fromName);
        const to = nameToId.get(toName);
        if (!from || !to) {
          console.warn(`Skipping edge - unknown location: ${fromName} -> ${toName}`);
          return null;
        }
        return { from, to, distanceMeters: distance, bidirectional: true };
      })
      .filter(Boolean);

    await Edge.insertMany(edgeDocs);

    console.log(`Done. ${createdLocations.length} locations and ${edgeDocs.length} paths created.`);
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
};

seed();
