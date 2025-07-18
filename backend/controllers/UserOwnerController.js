const UserOwner = require('../models/userOwner');

exports.getAllUsers = async (req, res) => {
    try {
        const users = await UserOwner.find();
        res.status(200).json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({
            message: 'Internal server error',
            error: error.message
        });
    }
}

exports.getUserById = async (req, res) => {
    const userId = req.params.id;
    try {
        const user = await UserOwner.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json(user);
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ 
            message: 'Internal server error',
            error: error.message
         });
    }
}

exports.createUser = async (req, res) => {
    const user = new UserOwner(req.body);
    try {

        const savedUser = await user.save();
        res.status(201).json({
            message: 'User created successfully',
            user: savedUser
        });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ message: 'Internal server error',
                        error: error.message
        });
    }
}

exports.updateUser = async (req, res) => {
    const userId = req.params.id;
    try {
        const updatedUser = await UserOwner.findByIdAndUpdate(userId, req.body, { new: true });
        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json(
            {
                message: 'User updated successfully',
                user: updatedUser
            }
        );   

    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ 
            message: 'Internal server error' ,
            error: error.message
        });
    }
}

exports.toggleUserStatus = async (req, res) => {
    const userId = req.params.id;
    try {
        const user = await UserOwner.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        user.status = user.status === 'active' ? 'inactive' : 'active';
        const updatedUser = await user.save();
        res.status(200).json({
            message: `User status updated to ${updatedUser.status}`,
            user: updatedUser
        });
    } catch (error) {
        console.error('Error toggling user status:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}