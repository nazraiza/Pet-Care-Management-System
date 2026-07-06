import HomeVisit from '../models/HomeVisit.js';
import User from '../models/User.js';
import AdoptionForm from '../models/AdoptionForm.js';
import AdoptablePet from '../models/AdoptablePet.js';
import AdoptedPet from '../models/AdoptedPet.js';
import asyncHandler from 'express-async-handler';

// @desc    Get all home visits
// @route   GET /api/homevisits
// @access  Private/Admin
export const getAllHomeVisits = asyncHandler(async (req, res) => {
  const homeVisits = await HomeVisit.find().sort({ date: -1 });
  res.json(homeVisits);
});

// @desc    Get user's home visits
// @route   GET /api/homevisits/my-visits
// @access  Private/User
export const getUserHomeVisits = asyncHandler(async (req, res) => {
  let userEmail = req.user?.email;

  if (!userEmail && req.user?.userId) {
    const user = await User.findById(req.user.userId).select('email');
    userEmail = user?.email;
  }

  if (!userEmail) {
    res.status(401);
    throw new Error('User email not found');
  }

  const homeVisits = await HomeVisit.find({ adopterEmail: String(userEmail).trim().toLowerCase() }).sort({ date: -1 });
  res.json(homeVisits);
});

// @desc    Get single home visit by ID
// @route   GET /api/homevisits/:id
// @access  Private
export const getHomeVisitById = asyncHandler(async (req, res) => {
  const homeVisit = await HomeVisit.findById(req.params.id);

  if (!homeVisit) {
    res.status(404);
    throw new Error('Home visit not found');
  }

  res.json(homeVisit);
});

// @desc    Create a new home visit
// @route   POST /api/homevisits
// @access  Private/Admin
export const createHomeVisit = asyncHandler(async (req, res) => {
  const {
    adoptionFormId,
    adopterName,
    adopterEmail,
    petName,
    date,
    startTime,
    endTime,
    notes,
    status
  } = req.body;

  const normalizedEmail = String(adopterEmail || '').trim().toLowerCase();
  const normalizedName = String(adopterName || '').trim();
  const normalizedPetName = String(petName || '').trim();
  const normalizedNotes = String(notes || '').trim();

  const scheduledDate = date
    ? (startTime ? new Date(`${date}T${startTime}:00`) : new Date(date))
    : new Date();

  const homeVisit = await HomeVisit.create({
    adoptionFormId,
    adopterName: normalizedName,
    adopterEmail: normalizedEmail,
    petName: normalizedPetName,
    date: scheduledDate,
    startTime: String(startTime || '').trim(),
    endTime: String(endTime || '').trim(),
    notes: normalizedNotes,
    status: ['scheduled', 'pending', 'approved', 'rejected'].includes(status) ? status : 'scheduled',
    userResponse: 'pending'
  });

  res.status(201).json(homeVisit);
});

// @desc    Update a home visit
// @route   PUT /api/homevisits/:id
// @access  Private/Admin
export const updateHomeVisit = asyncHandler(async (req, res) => {
  const homeVisit = await HomeVisit.findById(req.params.id);

  if (!homeVisit) {
    res.status(404);
    throw new Error('Home visit not found');
  }

  if (req.body.userResponse) {
    if (!['pending', 'accepted', 'rejected'].includes(req.body.userResponse)) {
      res.status(400);
      throw new Error('Invalid user response');
    }

    homeVisit.userResponse = req.body.userResponse;
    homeVisit.userNotes = req.body.userNotes || homeVisit.userNotes || '';
    homeVisit.respondedAt = new Date();
  }

  // If the user rejected the scheduled visit, mark the visit as rejected
  if (req.body.userResponse === 'rejected') {
    homeVisit.status = 'rejected';
  }

  if (req.body.status) {
    const requestedStatus = req.body.status;

    if (requestedStatus === 'approved') {
      homeVisit.status = 'approved';
    } else if (requestedStatus === 'visited' || requestedStatus === 'completed') {
      if (homeVisit.status !== 'approved') {
        homeVisit.status = 'approved';
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

  res.json({
    success: true,
    homeVisit: updatedHomeVisit
  });
});
// @desc    User responds to scheduled home visit
// @route   PATCH /api/homevisits/:id/respond
// @access  Private/User
export const respondHomeVisit = asyncHandler(async (req, res) => {
  const homeVisit = await HomeVisit.findById(req.params.id);

  if (!homeVisit) {
    res.status(404);
    throw new Error('Home visit not found');
  }

  const userEmail = req.user?.email;

  if (homeVisit.adopterEmail !== userEmail) {
    res.status(401);
    throw new Error('Not authorized to respond to this home visit');
  }

  const response = req.body.userResponse || req.body.response;

  if (!['accepted', 'rejected'].includes(response)) {
    res.status(400);
    throw new Error('Invalid response. Use accepted or rejected.');
  }

  homeVisit.userResponse = response;
  homeVisit.userNotes = req.body.userNotes || homeVisit.userNotes || '';
  homeVisit.respondedAt = new Date();

  if (response === 'rejected') {
    homeVisit.status = 'rejected';
  }

  const updatedHomeVisit = await homeVisit.save();

  res.json({
    success: true,
    message: `Home visit ${response} successfully`,
    homeVisit: updatedHomeVisit
  });
});

// @desc    Reject all home visits by adoption form ID
// @route   PUT /api/homevisits/by-form/:formId/reject
// @access  Private/Admin
export const rejectHomeVisitsByForm = asyncHandler(async (req, res) => {
  const updatedVisits = await HomeVisit.updateMany(
    { adoptionFormId: req.params.formId },
    { status: 'rejected' }
  );

  res.json({
    success: true,
    message: 'Related home visits rejected successfully',
    updatedVisits
  });
});

// @desc    Delete a home visit
// @route   DELETE /api/homevisits/:id
// @access  Private/Admin
export const deleteHomeVisit = asyncHandler(async (req, res) => {
  const homeVisit = await HomeVisit.findById(req.params.id);

  if (!homeVisit) {
    res.status(404);
    throw new Error('Home visit not found');
  }

  await homeVisit.deleteOne();

  res.json({ message: 'Home visit removed' });
});