/**
 * Форматирование для отображения: дата/время и деньги.
 */

/**
 * Форматирует дату как "d.m.yyyy HH:MM" (день/месяц без ведущих нулей,
 * часы/минуты с ведущим нулём). Используется на всех экранах с чеками;
 * раньше идентичная копия была в каждом компоненте.
 * @param {string|Date} date
 * @returns {string}
 */
export const formatDateTime = (date) => {
  const d = new Date(date);
  return `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

const numberFormatter = new Intl.NumberFormat('sr-RS', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const moneyFormatter = new Intl.NumberFormat('sr-RS', {
  style: 'currency',
  currency: 'RSD',
  currencyDisplay: 'code',
  minimumFractionDigits: 2,
});

/**
 * Форматирует число (два знака) в сербской локали: "1.234,50".
 * Без символа валюты — для компактных ячеек в таблицах.
 * @param {number} amount
 * @returns {string}
 */
export const formatNumber = (amount) => numberFormatter.format(amount);

/**
 * Форматирует сумму в динарах в сербской локали: "1.234,50 RSD".
 * @param {number} amount
 * @returns {string}
 */
export const formatMoney = (amount) => moneyFormatter.format(amount);
