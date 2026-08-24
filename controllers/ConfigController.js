// controllers/configController.js
import { SystemConfig } from '../models/SystemConfig.js';

// GET /api/config
export const getConfig = async (req, res) => {
  try {
    let config = await SystemConfig.findOne();
    if (!config) {
      config = await SystemConfig.create({}); // Create default if none exists
    }
    res.status(200).json(config);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch configuration' });
  }
};

// PUT /api/config
export const updateConfig = async (req, res) => {
  try {
    // Upsert ensures that if the config document was deleted, it creates a new one
    const updatedConfig = await SystemConfig.findOneAndUpdate(
      {}, 
      { $set: req.body }, 
      { new: true, upsert: true }
    );
    res.status(200).json(updatedConfig);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update configuration' });
  }
};