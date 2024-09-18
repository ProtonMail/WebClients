import { format } from 'date-fns';

import type { LabelModel } from '@proton/components';
import { getRandomAccentColor } from '@proton/shared/lib/colors';
import { LABEL_TYPE } from '@proton/shared/lib/constants';

/**
 * Returns the label under which every mails will be imported
 */
const getDefaultLabel = (email: string): LabelModel => ({
    Name: `${email.split('@')[1]} ${format(new Date(), 'dd-MM-yyyy HH:mm')}`,
    Color: getRandomAccentColor(),
    Type: LABEL_TYPE.MESSAGE_LABEL,
});

export default getDefaultLabel;
