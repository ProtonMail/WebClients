export const isExpired = ({ ExpMonth = 12, ExpYear = 9999 } = {}) => {
    const currentTime = new Date();
    const currentMonth = currentTime.getMonth() + 1;
    const currentYear = currentTime.getFullYear();

    return currentMonth >= +ExpMonth && currentYear >= +ExpYear;
};
