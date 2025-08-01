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
      sortBy = '[]',
      sortType = '[]',
      search = ''
    } = req.query;

    const pageNumber = parseInt(page);
    const limit = parseInt(rowsPerPage);
    const skip = (pageNumber - 1) * limit;

    // Parse sortBy and sortType arrays from query string
    let parsedSortBy = [];
    let parsedSortType = [];

    try {
      parsedSortBy = JSON.parse(sortBy);
      parsedSortType = JSON.parse(sortType);
    } catch (parseError) {
      return res.status(400).json({ message: 'Invalid sortBy or sortType format' });
    }

      if (!Array.isArray(parsedSortBy) || parsedSortBy.length === 0) {
      parsedSortBy = ['className']; // Default sort by className
      parsedSortType = ['asc'];
    }

    // Validate lengths match
    if (!Array.isArray(parsedSortBy) || !Array.isArray(parsedSortType) || parsedSortBy.length !== parsedSortType.length) {
      return res.status(400).json({ message: 'sortBy and sortType must be arrays of equal length' });
    }

    // Build sort object
    const sortObject = {};
    parsedSortBy.forEach((field, index) => {
      const direction = parsedSortType[index] === 'desc' ? -1 : 1;
      sortObject[field] = direction;
    });

    // Build search query
    const searchQuery = search
      ? {
          $or: [
            { className: { $regex: search, $options: 'i' } },
            { serialNumber: { $regex: search, $options: 'i' } },
            { brandName: { $regex: search, $options: 'i' } },
            { modelName: { $regex: search, $options: 'i' } },
            { location: { $regex: search, $options: 'i' } },
            { status: { $regex: search, $options: 'i' } },
          ]
        }
      : {};

    // Get total count
    const total = await ConfigurationItem.countDocuments(searchQuery);

    // Get paginated, sorted, filtered items
    const items = await ConfigurationItem.find(searchQuery)
      .sort(sortObject)
      .skip(skip)
      .limit(limit);

    // Return response
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