// backend/models/MedicalReport.js
import Pet from './Pet.js';

const formatMedicalRecord = (pet, record) => {
  return {
    _id: record._id,

    // Pet information
    petId: pet._id,
    petName: pet.name || "Unknown Pet",
    petSpecies: pet.species || "",
    petBreed: pet.breed || "",
    petAge: pet.age || "",
    petGender: pet.gender || "",

    // User information
    userId: pet.userId?._id || null,
    userName: pet.userId?.name || "Unknown User",
    userEmail: pet.userId?.email || "",
    userPhoneNumber: pet.userId?.phoneNumber || "",
    userCity: pet.userId?.city || "",

    // Report information
    type: record.type || "",
    date: record.date || null,
    diagnosis: record.diagnosis || "",
    treatment: record.treatment || "",
    groomingService: record.groomingService || "",
    groomerNotes: record.groomerNotes || "",
    trainingFocus: record.trainingFocus || "",
    trainerNotes: record.trainerNotes || "",
    description: record.description || "",
    prescription: record.prescription || {},
    doctorId: record.doctorId || null,
    createdAt: record.createdAt || null,
  };
};

const MedicalReport = {
  async find() {
    try {
      const pets = await Pet.find({}, { 
        name: 1,
        species: 1,
        breed: 1,
        age: 1,
        gender: 1,
        medicalRecords: 1,
        userId: 1
      }).populate('userId', 'name email phoneNumber city');

      const reports = pets.flatMap(pet =>
        (pet.medicalRecords || []).map(record =>
          formatMedicalRecord(pet, record)
        )
      );

      return reports.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.date || 0);
        const dateB = new Date(b.createdAt || b.date || 0);
        return dateB - dateA;
      });

    } catch (error) {
      console.error("Error inside MedicalReport.find():", error);
      throw error;
    }
  },

  async findByVet(vetId) {
    try {
      const pets = await Pet.find({ "medicalRecords.doctorId": vetId }, {
        name: 1,
        species: 1,
        breed: 1,
        age: 1,
        gender: 1,
        medicalRecords: 1,
        userId: 1
      }).populate('userId', 'name email phoneNumber city');

      const reports = pets.flatMap(pet =>
        (pet.medicalRecords || [])
          .filter(record => record.doctorId?.toString() === vetId.toString())
          .map(record => formatMedicalRecord(pet, record))
      );

      return reports.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.date || 0);
        const dateB = new Date(b.createdAt || b.date || 0);
        return dateB - dateA;
      });

    } catch (error) {
      console.error("Error inside MedicalReport.findByVet():", error);
      throw error;
    }
  },

  async findById(id) {
    try {
      const pets = await Pet.find({ "medicalRecords._id": id }, {
        name: 1,
        species: 1,
        breed: 1,
        age: 1,
        gender: 1,
        medicalRecords: 1,
        userId: 1
      }).populate('userId', 'name email phoneNumber city');

      for (const pet of pets) {
        const record = pet.medicalRecords.id(id);

        if (record) {
          return formatMedicalRecord(pet, record);
        }
      }

      return null;
    } catch (error) {
      console.error("Error inside MedicalReport.findById():", error);
      throw error;
    }
  }
};

export default MedicalReport;