/**
 * Преобразует внутреннее сообщение об ошибке парсинга чека в понятное
 * пользователю сообщение на русском.
 *
 * Единый источник правды для всех точек входа (сканер, добавление по ссылке,
 * ручной ввод) — раньше функция дублировалась и расходилась между ними.
 *
 * @param {string} errorMessage — сырое сообщение ошибки
 * @returns {string} понятное сообщение
 */
export const getUserFriendlyError = (errorMessage) => {
  if (errorMessage.includes('Failed to parse receipt') || errorMessage.includes('Invalid receipt URL')) {
    return 'Не удалось прочитать чек. Убедитесь, что ссылка правильная и попробуйте снова.';
  }
  if (errorMessage.includes('Invalid receipt data format')) {
    return 'Чек имеет неправильный формат. Возможно, чек устарел или недействителен.';
  }
  // Более конкретное сообщение проверяем раньше общего
  if (errorMessage.includes('Failed to fetch receipt specifications')) {
    return 'Не удалось получить детали продуктов. Возможно, чек ещё не обработан системой.';
  }
  if (errorMessage.includes('Failed to fetch receipt')) {
    return 'Не удалось получить данные чека с сервера. Проверьте подключение к интернету.';
  }
  if (errorMessage.includes('Network') || errorMessage.includes('fetch')) {
    return 'Ошибка подключения к интернету. Проверьте соединение и попробуйте снова.';
  }
  return errorMessage || 'Произошла ошибка. Попробуйте снова.';
};
