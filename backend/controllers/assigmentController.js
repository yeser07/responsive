const assignment = require('../models/assigment');


exports.getAllAssignments = async (req, res) => {
    try {
        const assignments = await assignment.find();
        res.status(200).json(assignments);
    } catch (error) {
        console.error('Error fetching assignments:', error);
        res.status(500).json({
            message: 'Internal server error',
            error: error.message
        });
    }
}

exports.getAssignmentByUserOwnerId = async (req, res) => {
    const userOwnerId = req.params.id;
    try {
        const assignments = await assignment.find({ userOwnerId: userOwnerId });
        if (!assignments || assignments.length === 0) {
            return res.status(404).json({ message: 'No assignments found for this user' });
        }
        res.status(200).json(assignments);
    } catch (error) {
        console.error('Error fetching assignments:', error);
        res.status(500).json({
            message: 'Internal server error',
            error: error.message
        });
    }
}

exports.getAssigmentById = async (req, res) => {
    const assignmentId = req.params.id;
    try {
        const assignmentData = await assignment.findById(assignmentId);
        if (!assignmentData) {
            return res.status(404).json({ message: 'Assignment not found' });
        }
        res.status(200).json(assignmentData);
    } catch (error) {
        console.error('Error fetching assignment:', error);
        res.status(500).json({
            message: 'Internal server error',
            error: error.message
        });
    }
}

exports.createAssignment = async (req, res) => {
    const newAssignment = new assignment(req.body);
    signatureFile = req.body.signatureFile;

    try {
        const savedAssignment = await newAssignment.save();

        if(savedAssignment){
            // Optionally, you can also update the ConfigurationItem status here if needed
            await ConfigurationItem.findByIdAndUpdate(savedAssignment.ConfigurationItemId, { status: 'In use' });



        }




        res.status(201).json({
            message: 'Assignment created successfully',
            assignment: savedAssignment
        });
    } catch (error) {
        console.error('Error creating assignment:', error);
        res.status(500).json({
            message: 'Internal server error',
            error: error.message
        });
    }
}

exports.updateAssignmentToReturned = async (req, res) => {
    const assignmentId = req.params.id;
    const returnDate = req.body.returnDate;
    try {
        const updatedAssignment = await assignment.findByIdAndUpdate(
            assignmentId,
            { returnDate: returnDate },
            { status: 'returned' },
            { new: true }
        );

        if (!updatedAssignment) {
            return res.status(404).json({ message: 'Assignment not found' });
        }
        res.status(200).json({
            message: 'Assignment updated successfully',
            assignment: updatedAssignment
        });    
    } catch (error) {
        console.error('Error updating assignment:', error);
        res.status(500).json({
            message: 'Internal server error',
            error: error.message
        });
    }
}


function createAssignmentLetter( assigmentId,signatureFile){
    
}