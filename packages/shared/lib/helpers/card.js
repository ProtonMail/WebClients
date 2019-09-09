/**
 * Check if card is expired at the end of current month
 * @param {Number} Details.ExpMonth
 * @param {Number} Details.ExpYear
 * @returns {Boolean}
 */
export const isExpired = ({ ExpMonth = 12, ExpYear = 9999 } = {}) => {
    const currentTime = new Date();
    const currentMonth = currentTime.getMonth() + 1;
    const currentYear = currentTime.getFullYear();

    return currentMonth > +ExpMonth && currentYear >= +ExpYear;
};
