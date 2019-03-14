export const isExpired = ({ ExpMonth, ExpYear } = {}) => {
    const currentTime = new Date();
    const month = currentTime.getMonth() + 1;
    const year = currentTime.getFullYear();

    return ExpMonth >= month && ExpYear >= year;
};
