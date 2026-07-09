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
