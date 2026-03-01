/**
 * Константы для налоговых ставок
 */
export const TAX_RATES = {
  STANDARD: 20,  // 20% - стандартная ставка
  REDUCED: 10    // 10% - льготная ставка (базовые продукты)
};

/**
 * Метки налоговых ставок из системы SUF
 */
export const TAX_LABELS = {
  Е: TAX_RATES.REDUCED,  // 10%
  Ђ: TAX_RATES.STANDARD  // 20%
};

/**
 * Единицы измерения
 */
export const UNITS = {
  PIECE: 'KOM',  // Штука
  KG: 'KG'       // Килограмм
};
