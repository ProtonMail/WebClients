import { format } from 'date-fns';

import type { LabelModel } from '@proton/components';
import { getRandomAccentColor } from '@proton/shared/lib/colors';
import { LABEL_TYPE } from '@proton/shared/lib/constants';
import { dateLocale } from '@proton/shared/lib/i18n';

const getSafeLabelName = (email: string): string => {
    const domain = email.split('@')[1] ?? 'Easy Switch';
    const date = format(new Date(), 'dd-MM-yyyy HH:mm', { locale: dateLocale });
    return `${domain} ${date}`;
};

/**
 * Returns the label under which every mails will be imported
 */
const getDefaultLabel = (email: string): LabelModel => ({
    Name: getSafeLabelName(email),
    Color: getRandomAccentColor(),
    Type: LABEL_TYPE.MESSAGE_LABEL,
});

export default getDefaultLabel;
