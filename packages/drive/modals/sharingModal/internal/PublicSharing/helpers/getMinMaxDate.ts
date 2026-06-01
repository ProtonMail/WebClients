export const getMinMaxDate = () => {
    const minDate = new Date();
    const maxDate = new Date();
    // Since BE is waiting for 90 days but with time consideration, we lowered it by one day to prevent issue
    // Exemple: If you are the 21 August 11:00AM then you can put expiration date to the 19 November 11:00AM max.
    // But user don't have date capability on web UI, so we set the end of the day. Which breaks as 19 November 11:59PM is after.
    // In that case we now set the max date to 18 November 11:59PM
    maxDate.setDate(maxDate.getDate() + 90 - 1);
    return { min: minDate, max: maxDate };
};
