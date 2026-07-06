import mongoose from 'mongoose';

const homeVisitSchema = new mongoose.Schema({
  adoptionFormId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdoptionForm',
    required: true
  },
  adopterName: {
    type: String,
    required: true
  },
  adopterEmail: {
    type: String,
    required: true
  },
  petName: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  startTime: {
    type: String,
    default: ''
  },
  endTime: {
    type: String,
    default: ''
  },
status: {
  type: String,
  enum: ['pending', 'scheduled', 'approved', 'rejected', 'visited', 'completed', 'cancelled'],
  default: 'pending'
},
userResponse: {
  type: String,
  enum: ['pending', 'accepted', 'rejected'],
  default: 'pending'
},
notes: {
  type: String,
  default: ''
},
userNotes: {
  type: String,
  default: ''
},
respondedAt: {
  type: Date
}
}, { timestamps: true });

const HomeVisit = mongoose.model('HomeVisit', homeVisitSchema);

export default HomeVisit; 