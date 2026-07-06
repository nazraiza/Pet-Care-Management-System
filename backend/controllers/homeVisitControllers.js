import HomeVisit from '../models/HomeVisit.js';
import AdoptionForm from '../models/AdoptionForm.js';
import AdoptablePet from '../models/AdoptablePet.js';
import AdoptedPet from '../models/AdoptedPet.js';

export const createHomeVisit = async (req, res) => {
  try {
    const {
      adoptionFormId,
      adopterName,
      adopterEmail,
      petName,
      date,
      notes
    } = req.body;

    const emailNormalized = String(adopterEmail || '').trim().toLowerCase();
    console.log('CreateHomeVisit adopterEmail original:', adopterEmail, 'normalized:', emailNormalized);
    const homeVisit = await HomeVisit.create({
      adoptionFormId,
      adopterName: String(adopterName || '').trim(),
      adopterEmail: emailNormalized,
      petName: String(petName || '').trim(),
      date,
      notes: String(notes || '').trim(),
      status: 'pending',
      userResponse: 'pending'
    });

    // Update adoption form status to approved_for_home_visit
    if (homeVisit.adoptionFormId) {
      await AdoptionForm.findByIdAndUpdate(
        homeVisit.adoptionFormId,
        { status: 'approved_for_home_visit' },
        { new: true }
      );
    }

    res.status(201).json(homeVisit);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getAllHomeVisits = async (req, res) => {
  try {
    const homeVisits = await HomeVisit.find();
    res.status(200).json(homeVisits);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getHomeVisitById = async (req, res) => {
  try {
    const homeVisit = await HomeVisit.findById(req.params.id);
    if (!homeVisit) {
      return res.status(404).json({ error: 'Home visit not found' });
    }
    res.status(200).json(homeVisit);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateHomeVisit = async (req, res) => {
  try {
    const homeVisit = await HomeVisit.findById(req.params.id);
    if (!homeVisit) {
      return res.status(404).json({ error: 'Home visit not found' });
    }

    const responseValue = req.body.userResponse || req.body.response;
    if (responseValue) {
      if (!['accepted', 'rejected'].includes(responseValue)) {
        return res.status(400).json({ error: 'Invalid response. Use accepted or rejected.' });
      }

      homeVisit.userResponse = responseValue;
      homeVisit.userNotes = req.body.userNotes || homeVisit.userNotes || '';
      homeVisit.respondedAt = new Date();

      if (responseValue === 'rejected') {
        homeVisit.status = 'rejected';
      }
    }

    if (req.body.status) {
      const requestedStatus = req.body.status;

      if (requestedStatus === 'approved') {
        if (homeVisit.userResponse !== 'accepted') {
          return res.status(400).json({ error: 'Visit must be accepted by the user before it can be approved.' });
        }
        homeVisit.status = 'approved';
      } else if (requestedStatus === 'visited' || requestedStatus === 'completed') {
        if (homeVisit.status !== 'approved') {
          return res.status(400).json({ error: 'Only approved visits can be completed.' });
        }

        homeVisit.status = 'visited';

        if (homeVisit.adoptionFormId) {
          const adoptionForm = await AdoptionForm.findById(homeVisit.adoptionFormId);
          if (adoptionForm) {
            adoptionForm.status = 'approved';
            await adoptionForm.save();
          }
        }

        const adoptablePet = await AdoptablePet.findOne({ petName: homeVisit.petName });
        if (adoptablePet) {
          const adoptedPetData = adoptablePet.toObject();
          delete adoptedPetData._id;
          delete adoptedPetData.createdAt;
          delete adoptedPetData.updatedAt;
          const adoptedPet = new AdoptedPet(adoptedPetData);
          await adoptedPet.save();
          await adoptablePet.deleteOne();
        }
      } else if (requestedStatus === 'rejected') {
        homeVisit.status = 'rejected';
      } else {
        homeVisit.status = requestedStatus;
      }
    }

    if (req.body.date) {
      homeVisit.date = req.body.date;
    }

    if (req.body.notes !== undefined) {
      homeVisit.notes = req.body.notes;
    }

    const updatedHomeVisit = await homeVisit.save();
    res.status(200).json(updatedHomeVisit);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteHomeVisit = async (req, res) => {
  try {
    const homeVisit = await HomeVisit.findByIdAndDelete(req.params.id);
    if (!homeVisit) {
      return res.status(404).json({ error: 'Home visit not found' });
    }
    res.status(200).json({ message: 'Home visit deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getUserHomeVisits = async (req, res) => {
  try {
    const originalEmail = req.user?.email;
    const userEmail = String(originalEmail || '').trim().toLowerCase();
    console.log('getUserHomeVisits original user email:', originalEmail, 'normalized:', userEmail);
    const homeVisits = await HomeVisit.find({ adopterEmail: userEmail }).sort({ date: -1 });
    res.status(200).json(homeVisits);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const rejectHomeVisitsByForm = async (req, res) => {
  try {
    const { formId } = req.params;
    const result = await HomeVisit.updateMany(
      { adoptionFormId: formId },
      { $set: { userResponse: 'rejected', status: 'rejected' } }
    );
    res.status(200).json({ message: 'Home visits rejected', result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}; 