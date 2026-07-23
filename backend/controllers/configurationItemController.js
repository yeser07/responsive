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
    const status = req.body.status || decodeURIComponent(req.params.status || '');
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
        res.status(200).json({
            message: `Configuration item status updated to ${status}`,
            item: updatedItem
        });
    } catch (error) {
        res.status(500).json({
            message: 'Internal server error',
            error: error.message
         });
    }
};

exports.importConfigurationItems = async (req, res) => {
    const items = req.body.items;
    if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: 'items must be a non-empty array' });
    }

    const required = ['className', 'serialNumber', 'brandName', 'modelName', 'location'];
    const created = [];
    const errors = [];

    for (let i = 0; i < items.length; i++) {
        const row = items[i] || {};
        const missing = required.filter((field) => !row[field]);
        if (missing.length) {
            errors.push({ index: i, serialNumber: row.serialNumber, message: `Missing fields: ${missing.join(', ')}` });
            continue;
        }

        try {
            const payload = {
                className: String(row.className).trim(),
                serialNumber: String(row.serialNumber).trim(),
                brandName: String(row.brandName).trim(),
                modelName: String(row.modelName).trim(),
                location: String(row.location).trim(),
                status: row.status && ['In use', 'stock', 'retired', 'missing', 'damaged'].includes(row.status)
                    ? row.status
                    : 'stock',
            };
            const item = await ConfigurationItem.create(payload);
            created.push(item);
        } catch (error) {
            errors.push({
                index: i,
                serialNumber: row.serialNumber,
                message: error.code === 11000 ? 'Duplicate serialNumber' : error.message,
            });
        }
    }

    res.status(created.length ? 201 : 400).json({
        message: `Imported ${created.length} of ${items.length} items`,
        createdCount: created.length,
        errorCount: errors.length,
        created,
        errors,
    });
};