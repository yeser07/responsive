const { ConfigurationItem } = require('../models/configurationItem');

exports.createConfigurationItem = async (req, res) => {
    try {
        const newItem = new ConfigurationItem(req.body); // ✅ Correcto
        await newItem.save();
        res.status(201).json({
            message: 'Configuration item created successfully',
            item: newItem
        });
    } catch (error) {
        res.status(500).json({ 
            message: 'Internal server error',
            error: error.message
        });
    }
};


exports.updateConfigurationItem = async (req, res) => {
    const itemId = req.params.id;
    try {
        const updatedItem = await ConfigurationItem.findByIdAndUpdate(itemId, req.body, { new: true });
        if (!updatedItem) {
            return res.status(404).json({ message: 'Configuration item not found' });
        }
        res.status(200).json(
            {
                message: 'Configuration item updated successfully',
                item: updatedItem
            });
    } catch (error) {
        res.status(500).json({ 
            message: 'Internal server error',
            error: error.message
         });
    }
}

exports.getConfigurationItemById = async (req, res) => {
    const itemId = req.params.id;
    try {
        const item = await ConfigurationItem.findById(itemId);
        if (!item) {
            return res.status(404).json({ message: 'Configuration item not found' });
        }
        res.status(200).json(item);
    } catch (error) {
        res.status(500).json({ 
            message: 'Internal server error',
            error: error.message
         });
    }
}


exports.getAllConfigurationItems = async (req, res) => {
  try {
    const {
      page = 1,
      rowsPerPage = 10,
      sortBy = '',
      sortType = 'asc',
      search = ''
    } = req.query;

    const pageNumber = parseInt(page);
    const limit = parseInt(rowsPerPage);
    const skip = (pageNumber - 1) * limit;

    const searchQuery = {
      $or: [
        { className: { $regex: search, $options: 'i' } },
        { serialNumber: { $regex: search, $options: 'i' } },
        { brandName: { $regex: search, $options: 'i' } },
        { modelName: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
        { status: { $regex: search, $options: 'i' } },
      ]
    };

    const sortObject = sortBy ? { [sortBy]: sortType === 'desc' ? -1 : 1 } : {};

    const total = await ConfigurationItem.countDocuments(search ? searchQuery : {});
    const items = await ConfigurationItem
      .find(search ? searchQuery : {})
      .sort(sortObject)
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      items,
      total,
    });

  } catch (error) {
    res.status(500).json({
      message: 'Internal server error',
      error: error.message,
    });
  }
};


exports.toggleConfigurationItemStatus = async (req, res) => {
    
    const itemId = req.params.id;
    const status = req.params.status;
    try {
        const item = await ConfigurationItem.findById(itemId);
        if (!item) {
            return res.status(404).json({ message: 'Configuration item not found' });
        }
        const validStatuses = ['In use', 'stock', 'retired', 'missing', 'damaged'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status value' });
        }

        item.status = status;
        
        const updatedItem = await item.save();
        res.status(200).json(
            {
                message: `Configuration item status updated to ${status}`,
                item: updatedItem
            });
    } catch (error) {
        res.status(500).json({ 
            message: 'Internal server error',
            error: error.message
         });
    }
}