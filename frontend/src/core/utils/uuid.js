/**
 * Генерирует UUID v4.
 *
 * crypto.randomUUID() доступен только в безопасном контексте (https или
 * localhost). На plain http — например, при раздаче дев-сборки по LAN IP
 * вроде http://192.168.x.x — он отсутствует и бросает ошибку, что ломало бы
 * создание чеков/продуктов/покупателей. Поэтому используем fallback.
 *
 * @returns {string} UUID v4
 */
export const uuid = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  // RFC 4122 v4 fallback на Math.random
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};
