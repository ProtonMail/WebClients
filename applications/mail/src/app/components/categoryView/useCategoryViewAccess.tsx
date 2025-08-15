import { isCategoryLabel } from '@proton/mail/helpers/location';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { useFlag } from '@proton/unleash';

import { params } from 'proton-mail/store/elements/elementsSelectors';
import { useMailSelector } from 'proton-mail/store/hooks';

export const useCategoryViewAccess = () => {
    const categoryViewAccess = useFlag('CategoryView');
    const mailParams = useMailSelector(params);

    return (
        categoryViewAccess && (mailParams.labelID === MAILBOX_LABEL_IDS.INBOX || isCategoryLabel(mailParams.labelID))
    );
};
