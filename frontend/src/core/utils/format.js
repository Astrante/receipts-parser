/**
 * Форматирование даты/времени для отображения.
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
