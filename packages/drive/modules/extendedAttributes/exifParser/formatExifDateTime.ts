export const formatExifDateTime = (exifDateTime: string) => {
    const regex = /^\d{4}:\d{2}:\d{2} \d{2}:\d{2}:\d{2}$/;
    if (!regex.test(exifDateTime)) {
        throw new Error(
            `The DateTime passed is not in the right format (received: ${exifDateTime}, expected: YYYY:MM:DD HH:MM:SS)`
        );
    }
    const splitDate = exifDateTime.split(' ');
    const dateStr = splitDate[0].replace(/:/g, '-');
    return dateStr + ' ' + splitDate[1];
};
