import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { useFlag } from '@proton/unleash';

import { params } from 'proton-mail/store/elements/elementsSelectors';
import { useMailSelector } from 'proton-mail/store/hooks';

export const useCategoryViewAccess = () => {
    const hasAccess = useFlag('CategoryView');
    const mailParams = useMailSelector(params);

    return hasAccess && mailParams.labelID === MAILBOX_LABEL_IDS.INBOX;
};
