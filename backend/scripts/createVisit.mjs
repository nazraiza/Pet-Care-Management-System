import dotenv from 'dotenv';
import mongoose from 'mongoose';
import HomeVisit from '../models/HomeVisit.js';

dotenv.config();
const uri = process.env.MONGODB_URI;
const formId = process.argv[2];
const adopterEmail = process.argv[3] || 'testuser+1@example.com';

if (!uri) {
  console.error('MONGODB_URI not found');
  process.exit(1);
}
if (!formId) {
  console.error('Provide adoptionFormId as first arg');
  process.exit(1);
}

async function run() {
  await mongoose.connect(uri, { family: 4 });
  console.log('Connected');
  const visit = await HomeVisit.create({
    adoptionFormId: formId,
    adopterName: 'Test User',
    adopterEmail: adopterEmail,
    petName: 'Buddy',
    date: new Date('2026-06-03T10:00:00Z'),
    startTime: '10:00',
    endTime: '11:00',
    status: 'scheduled',
    userResponse: 'pending',
    notes: 'Scheduled by coordinator for testing'
  });
  console.log('Created visit:', visit._id.toString());
  await mongoose.disconnect();
}

run().catch(err => { console.error(err); process.exit(1); });
