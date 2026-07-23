const mongoose = require('mongoose');
const { Schema } = mongoose;

const letterTemplateSchema = new Schema(
  {
    key: { type: String, unique: true, default: 'default' },
    companyName: { type: String, default: 'Mabe' },
    title: {
      type: String,
      default: 'CARTA DE RESPONSABILIDAD DE EQUIPOS TECNOLÓGICOS',
    },
    legalText: {
      type: String,
      default:
        'Declaro que tengo bajo mi responsabilidad el siguiente {equipmentType} y entiendo que debo utilizarlo de la forma correcta. Conozco la política de uso de los recursos informáticos y me comprometo a regresarlo en buenas condiciones.',
    },
    logoDataUrl: { type: String, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('LetterTemplate', letterTemplateSchema);
