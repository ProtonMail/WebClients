import { Currency } from "../interfaces";

/**
 * Make amount readable
 * 600 -> 6, 650 -> 6.50, 633 -> 6.33
 */
const humanPrice = (amount: number = 0, divisor: number = 100) => {
    const fixedValue = Number(amount / divisor).toFixed(2);
    return fixedValue.replace('.00', '').replace('-', '');
};

export default humanPrice;

export const humanPriceWithCurrency = (price: number, currency: Currency, divisor?: number) => {
    const value = humanPrice(price, divisor);
    const [integer, decimal] = `${value}`.split('.');
    
    if (currency === 'EUR') {
        return `${integer}.${decimal} €`;
    }

    if (currency === 'CHF') {
        return `CHF ${integer}.${decimal}`;
    }
    
    return `$${integer}.${decimal}`;
};
