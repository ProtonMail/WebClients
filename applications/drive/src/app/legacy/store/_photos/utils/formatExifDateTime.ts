export const formatExifDateTime = (exifDateTime: string) => {
    const regex = /^\d{4}:\d{2}:\d{2} \d{2}:\d{2}:\d{2}$/;
    if (!regex.test(exifDateTime)) {
        throw new Error(
            `The DateTime passed is not in the right format (received: ${exifDateTime}, expected: YYYY:MM:DD HH:MM:SS)`
        );
    }
    const splitDate = exifDateTime.split(' ');
    //get date part and replace ':' with '-'
    const dateStr = splitDate[0].replace(/:/g, '-');
    //concat the strings (date and time part)
    return dateStr + ' ' + splitDate[1];
};
