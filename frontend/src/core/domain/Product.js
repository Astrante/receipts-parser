import { uuid } from '../utils/uuid.js';

/**
 * Создаёт новую сущность Product
 * @param {Object} data - Данные продукта
 * @returns {Product}
 */
export function createProduct(data) {
  return {
    id: uuid(),
    name: data.name || '',
    quantity: data.quantity || 0,
    unit: data.unit || 'KOM',
    unitPrice: data.unitPrice || 0,
    total: data.total || 0,
    taxRate: data.taxRate || 0,
    distribution: data.distribution || {}
  };
}

/**
 * Вычисляет цену за единицу с учётом распределения
 * @param {Product} product
 * @returns {number}
 */
export function getUnitPrice(product) {
  return product.total / product.quantity;
}

const DISTRIBUTION_DECIMALS = 3;

/**
 * Округляет долю количества, убирая пыль плавающей запятой
 * (0.1 + 0.2 !== 0.3 и т.п.).
 * @param {number} value
 * @returns {number}
 */
const roundShare = (value) => {
  const factor = 10 ** DISTRIBUTION_DECIMALS;
  return Math.round((value + Number.EPSILON) * factor) / factor;
};

/**
 * Сводит распределение количества продукта между покупателями так, чтобы
 * сумма долей точно равнялась quantity. Первый покупатель поглощает остаток
 * (это его роль в модели распределения), а доли округляются — иначе за
 * несколько правок набегает пыль плавающей запятой и итоги по покупателям
 * расходятся с суммой продукта.
 *
 * @param {Object} distribution - текущее распределение { buyerId: share }
 * @param {Array} buyers - покупатели (первый — поглотитель остатка)
 * @param {number} quantity - целевое количество продукта
 * @returns {Object} свернутое распределение
 */
export const reconcileDistribution = (distribution, buyers, quantity) => {
  if (!buyers || buyers.length === 0) return { ...distribution };

  const reconciled = {};
  const firstBuyerId = buyers[0].id;
  let othersSum = 0;

  for (const buyer of buyers) {
    if (buyer.id === firstBuyerId) continue;
    const rounded = roundShare(distribution[buyer.id] || 0);
    reconciled[buyer.id] = rounded;
    othersSum += rounded;
  }

  // Первый покупатель = остаток, чтобы сумма точно равнялась quantity
  reconciled[firstBuyerId] = roundShare(quantity - othersSum);
  return reconciled;
};
