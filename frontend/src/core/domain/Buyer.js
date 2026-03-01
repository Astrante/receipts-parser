/**
 * Создаёт новую сущность Buyer
 * @param {Object} data - Данные покупателя
 * @returns {Buyer}
 */
export function createBuyer(data) {
  return {
    id: crypto.randomUUID(),
    name: data.name || '',
    totalShare: data.totalShare || 0
  };
}

/**
 * Вычисляет долю покупателя в чеке
 * @param {string} buyerId - ID покупателя
 * @param {Receipt} receipt - Чек
 * @returns {number}
 */
export function calculateBuyerShare(buyerId, receipt) {
  return receipt.products.reduce((sum, product) => {
    const dist = product.distribution || {};
    const share = dist[buyerId] || 0;
    const unitPrice = product.total / product.quantity;
    return sum + (share * unitPrice);
  }, 0);
}
