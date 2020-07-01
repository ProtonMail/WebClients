/**
 * Check if card is expired at the end of current month
 */
export const isExpired = ({ ExpMonth = 12, ExpYear = 9999 }: { ExpMonth?: number; ExpYear?: number } = {}): boolean => {
    const currentTime = new Date();
    const currentMonth = currentTime.getMonth() + 1;
    const currentYear = currentTime.getFullYear();

    return currentMonth > +ExpMonth && currentYear >= +ExpYear;
};
