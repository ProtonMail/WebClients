import { useCategoriesData } from '@proton/mail';
import { isCategoryLabel } from '@proton/mail/helpers/location';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { useFlag } from '@proton/unleash';

import { params } from 'proton-mail/store/elements/elementsSelectors';
import { useMailSelector } from 'proton-mail/store/hooks';

export const useCategoriesView = () => {
    const [mailSettings] = useMailSettings();
    const categoryViewFlag = useFlag('CategoryView');

    const mailParams = useMailSelector(params);
    const categoriesData = useCategoriesData();

    const isInboxOrCategory = mailParams.labelID === MAILBOX_LABEL_IDS.INBOX || isCategoryLabel(mailParams.labelID);

    return {
        ...categoriesData,
        shouldShowTabs: categoryViewFlag && isInboxOrCategory && (mailSettings?.MailCategoryView || false),
    };
};
