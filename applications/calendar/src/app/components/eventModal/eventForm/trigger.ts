export const transformBeforeAt = (at: Date) => {
    const minutes = 60 - (at.getMinutes() || 60);
    const hours = 24 - (at.getHours() || 24) - (minutes > 0 ? 1 : 0);
    return new Date(at.getFullYear(), at.getMonth(), at.getDate(), hours, minutes);
};
