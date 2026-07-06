// backend/models/Pet.js
import mongoose from 'mongoose';

const medicalReportSchema = new mongoose.Schema({
  type: { 
    type: String, 
    required: true, 
    enum: ['Medical', 'Grooming', 'Training', 'Vaccination', 'Prescription']
  },
  date: { type: Date, required: true },
  diagnosis: { type: String, required: function() { return this.type === 'Medical'; } },
  treatment: { type: String, required: function() { return this.type === 'Medical'; } },
  groomingService: { type: String, required: function() { return this.type === 'Grooming'; } },
  groomerNotes: { type: String, required: function() { return this.type === 'Grooming'; } },
  trainingFocus: { type: String, required: function() { return this.type === 'Training'; } },
  trainerNotes: { type: String, required: function() { return this.type === 'Training'; } },
  description: { type: String, required: function() { return this.type === 'Vaccination'; } },
  prescription: {
    medicines: [
      {
        name: { type: String },
        dosage: { type: String },
        frequency: { type: String },
        duration: { type: String },
        instructions: { type: String },
      }
    ],
    advice: { type: String },
    followUpDate: { type: Date },
  },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Professional' } // changed to ObjectId
});

const petSchema = new mongoose.Schema({
  petId: { 
    type: String, 
    required: true, 
    unique: true
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true, 
    ref: 'User',
    index: true
  },
  name: { type: String, required: true },
  gender: { type: String, required: true },
  breed: { type: String, required: true },
  petBYear: { type: Number, required: true },
  petimage: { 
    type: String, 
    default: 'https://via.placeholder.com/150'
  },
  specialNotes: { 
    type: String 
  },
  medicalRecords: { type: [medicalReportSchema], default: [] }, // default empty array
});

export default mongoose.model('Pet', petSchema);