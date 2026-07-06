import AdoptionForm from '../models/AdoptionForm.js';
import User from '../models/User.js';
import HomeVisit from '../models/HomeVisit.js';

// Create a new adoption application
export const createApplication = async (req, res) => {
    try {
        const {
            firstName,
            lastName,
            email,
            phoneNumber,
            petType,
            petName,
            petImage,
            homeType,
            employmentStatus,
            hasYard,
            hasOtherPets,
            additionalInfo,
            homeVisitPreferences
        } = req.body;

        const now = new Date();
        const twelveHoursAhead = new Date(now.getTime() + 12 * 60 * 60 * 1000);

        if (!Array.isArray(homeVisitPreferences) || homeVisitPreferences.length === 0) {
            return res.status(400).json({ error: 'Please provide at least one home visit preference.' });
        }

        for (const preference of homeVisitPreferences) {
            const { date, startTime, endTime } = preference;
            if (!date || !startTime || !endTime) {
                return res.status(400).json({ error: 'Each home visit preference requires a date, start time and end time.' });
            }

            const startDateTime = new Date(`${date}T${startTime}:00`);
            const endDateTime = new Date(`${date}T${endTime}:00`);

            if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
                return res.status(400).json({ error: 'Invalid home visit date or time format.' });
            }

            if (startDateTime >= endDateTime) {
                return res.status(400).json({ error: 'Home visit start time must be before end time.' });
            }

            if (startDateTime < now) {
                return res.status(400).json({ error: 'Please choose a home visit preference that is at least 12 hours from now.' });
            }

            if (startDateTime < twelveHoursAhead) {
                return res.status(400).json({ error: 'Please choose a home visit preference that is at least 12 hours from now.' });
            }
        }

        const application = new AdoptionForm({
            firstName,
            lastName,
            email,
            phoneNumber,
            petType,
            petName,
            petImage,
            homeType,
            employmentStatus,
            hasYard,
            hasOtherPets,
            additionalInfo,
            homeVisitPreferences,
            status: 'pending' // ensures admin sees it
        });

        await application.save();

        // --- HomeVisit creation removed ---
        // Admin will schedule the home visit manually after seeing the form

        res.status(201).json(application);
    } catch (error) {
        console.error('Error creating adoption application:', error);
        res.status(400).json({ error: error.message });
    }
};

// Get all applications for the logged-in user
export const getUserApplications = async (req, res) => {
    try {
        let email = req.user?.email;

        if (!email && req.user?.userId) {
            const user = await User.findById(req.user.userId).select('email');
            email = user?.email;
        }

        if (!email) {
            return res.status(401).json({ error: "Unauthorized: User email is missing" });
        }

        const applications = await AdoptionForm.find({ email });
        res.status(200).json(applications);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get single adoption application by ID
export const getApplicationById = async (req, res) => {
    try {
        const application = await AdoptionForm.findById(req.params.id);
        if (!application) {
            return res.status(404).json({ error: "Application not found" });
        }
        res.status(200).json(application);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update an adoption application
export const updateApplication = async (req, res) => {
    try {
        const existingHomeVisit = await HomeVisit.findOne({ adoptionFormId: req.params.id });
        if (existingHomeVisit) {
            return res.status(403).json({ error: 'Cannot edit adoption form after a visit has been scheduled by the admin.' });
        }

        const application = await AdoptionForm.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.status(200).json(application);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Delete an adoption application
export const deleteApplication = async (req, res) => {
    try {
        await AdoptionForm.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Application deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get all adoption applications
export const getAllApplications = async (req, res) => {
    try {
        const applications = await AdoptionForm.find();
        res.status(200).json(applications);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Schedule a visit time by admin
export const scheduleVisitTime = async (req, res) => {
    try {
        const { id } = req.params;
        const { date, time } = req.body;

        if (!date || !time) {
            return res.status(400).json({ error: "Date and time are required" });
        }

        const application = await AdoptionForm.findByIdAndUpdate(
            id,
            {
                adminScheduledDate: date,
                adminScheduledTime: time,
                isFormLocked: true,
                userApproval: false
            },
            { new: true }
        );

        if (!application) {
            return res.status(404).json({ error: "Application not found" });
        }

        res.status(200).json(application);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Reject a scheduled time by user
export const rejectScheduledTime = async (req, res) => {
    try {
        const { id } = req.params;

        const application = await AdoptionForm.findById(id);
        if (!application) {
            return res.status(404).json({ error: "Application not found" });
        }

        if (application.adminScheduledDate && application.adminScheduledTime) {
            application.rejectedTimes.push({
                date: application.adminScheduledDate,
                time: application.adminScheduledTime
            });
        }

        application.adminScheduledDate = null;
        application.adminScheduledTime = null;
        application.userApproval = false;

        await application.save();
        res.status(200).json(application);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Approve a scheduled time by user
export const approveScheduledTime = async (req, res) => {
    try {
        const { id } = req.params;

        const application = await AdoptionForm.findByIdAndUpdate(
            id,
            { userApproval: true },
            { new: true }
        );

        if (!application) {
            return res.status(404).json({ error: "Application not found" });
        }

        res.status(200).json(application);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};