import { format } from 'date-fns';

import getRandomLabelColor from '@proton/activation/helpers/getRandomLabelColor';
import { LabelModel } from '@proton/components/containers/labels/modals/EditLabelModal';
import { LABEL_TYPE } from '@proton/shared/lib/constants';

/**
 * Returns the label under which every mails will be imported
 */
const getDefaultLabel = (email: string): LabelModel => ({
    Name: `${email.split('@')[1]} ${format(new Date(), 'dd-MM-yyyy HH:mm')}`,
    Color: getRandomLabelColor(),
    Type: LABEL_TYPE.MESSAGE_LABEL,
});

export default getDefaultLabel;
