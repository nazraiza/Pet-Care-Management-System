import dotenv from 'dotenv';
import mongoose from 'mongoose';
import HomeVisit from '../models/HomeVisit.js';

dotenv.config();
const uri = process.env.MONGODB_URI;
const visitId = process.argv[2];
const note = process.argv[3] || 'Please choose another time';

if (!uri) {
  console.error('MONGODB_URI not found');
  process.exit(1);
}
if (!visitId) {
  console.error('Provide visit id as first arg');
  process.exit(1);
}

async function run() {
  await mongoose.connect(uri, { family: 4 });
  console.log('Connected');
  const visit = await HomeVisit.findById(visitId);
  if (!visit) {
    console.error('Visit not found');
    process.exit(1);
  }
  visit.userResponse = 'rejected';
  visit.userNotes = note;
  visit.respondedAt = new Date();
  visit.status = 'rejected';
  await visit.save();
  console.log('Updated visit', visitId);
  await mongoose.disconnect();
}

run().catch(err => { console.error(err); process.exit(1); });
