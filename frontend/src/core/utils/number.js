/**
 * Утилиты для работы с числами, вводимыми пользователем.
 */

/**
 * Парсит введённое значение количества в число.
 *
 * Принимает и ".", и "," как десятичный разделитель. На iOS десятичная
 * клавиатура (inputMode="decimal") показывает разделитель согласно локали
 * устройства (например запятую в сербской локали), а parseFloat понимает
 * только точку — поэтому сначала нормализуем разделитель.
 *
 * @param {string} value — сырая строка из input
 * @returns {number} распарсенное число либо 0 для пустого/некорректного ввода
 */
export const parseAmount = (value) => {
  if (value === '' || value === null || value === undefined) return 0;
  const normalized = String(value)
    .replace(',', '.')
    .replace(/[^0-9.]/g, '');
  const num = parseFloat(normalized);
  return isNaN(num) ? 0 : num;
};
