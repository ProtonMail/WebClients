/**
 * Round a number, x, to a certain number, n, of decimal places.
 * If n < 0, keep the significative digits up to 10 ** (-n)
 */
export default function withDecimalPrecision(x: number, n: number) {
    // assume n is an integer. Round to integer otherwise
    const powerOfTen = 10 ** Math.round(n);
    if (powerOfTen > Number.MAX_VALUE) {
        return x;
    }
    if (powerOfTen < Number.MIN_VALUE) {
        return 0;
    }
    return Math.round(x * powerOfTen) / powerOfTen;
}
