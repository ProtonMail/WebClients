import { default as enGBLocale } from 'date-fns/locale/en-GB';
import { default as enUSLocale } from 'date-fns/locale/en-US';
import { default as faIRLocale } from 'date-fns/locale/fa-IR';

import { dateFnsLocaleMap } from './dateFnsLocaleMap';

export { enUSLocale };
export { enGBLocale };
export { faIRLocale };

export const getDateFnLocale = (value: string) => {
    if (value === 'en_US') {
        return enUSLocale;
    }
    if (value === 'en_GB') {
        return enGBLocale;
    }
    if (value === 'fa_IR') {
        return faIRLocale;
    }
    return dateFnsLocaleMap[value]();
};

export default dateFnsLocaleMap;
