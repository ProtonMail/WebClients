/**
 * Make amount readable
 * 600 -> 6, 650 -> 6.50, 633 -> 6.33
 * @param {Number} amount
 * @param {Number} divisor
 * @return {String}
 */
const humanPrice = (amount = 0, divisor = 100) => {
    const fixedValue = Number(amount / divisor).toFixed(2);
    return fixedValue.replace('.00', '').replace('-', '');
};

export default humanPrice;
