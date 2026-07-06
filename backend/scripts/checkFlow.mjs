import dotenv from 'dotenv';
import mongoose from 'mongoose';
import AdoptionForm from '../models/AdoptionForm.js';
import HomeVisit from '../models/HomeVisit.js';

dotenv.config();

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('MONGODB_URI not found in environment');
  process.exit(1);
}

const formId = process.argv[2];

async function run() {
  await mongoose.connect(uri, { family: 4 });
  console.log('Connected to MongoDB');

  if (!formId) {
    console.log('Please provide an adoption form id as the first argument');
    process.exit(0);
  }

  const form = await AdoptionForm.findById(formId).lean();
  console.log('AdoptionForm:', form ? JSON.stringify(form, null, 2) : 'Not found');

  const visits = await HomeVisit.find({ adoptionFormId: formId }).lean();
  console.log(`Related HomeVisits (${visits.length}):`);
  visits.forEach(v => console.log(JSON.stringify(v, null, 2)));

  await mongoose.disconnect();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
