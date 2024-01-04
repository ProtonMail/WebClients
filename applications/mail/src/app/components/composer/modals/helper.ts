import { c, msgid } from 'ttag';

export const getChooseDateText = (n: number) => {
    // translator : The variable is the number of days, written in digits
    return c('Error').ngettext(
        msgid`Choose a date within the next ${n} day.`,
        `Choose a date within the next ${n} days.`,
        n
    );
};
