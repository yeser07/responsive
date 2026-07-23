const mongoose = require('mongoose');
const { Schema } = mongoose;

const letterTemplateSchema = new Schema(
  {
    key: { type: String, unique: true, default: 'default' },
    companyName: { type: String, default: 'CI Manager' },
    title: { type: String, default: 'Carta Responsiva de Activo' },
    legalText: {
      type: String,
      default:
        'Me comprometo a cuidar el equipo, usarlo únicamente para fines laborales y reportar cualquier daño, pérdida o mal funcionamiento de forma inmediata.',
    },
    logoDataUrl: { type: String, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('LetterTemplate', letterTemplateSchema);
