import { useCategoriesData } from '@proton/mail';
import { isCategoryLabel } from '@proton/mail/helpers/location';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

import { params } from 'proton-mail/store/elements/elementsSelectors';
import { useMailSelector } from 'proton-mail/store/hooks';

import { useB2BCategoriesOnboardingModal } from './categoriesOnboarding/useB2BCategoriesOnboardingModal';

export const useCategoriesView = () => {
    const mailParams = useMailSelector(params);
    const categoriesData = useCategoriesData();

    // This hooks will automatically open the b2b onboarding modal if a new b2b users is eligible.
    useB2BCategoriesOnboardingModal();

    const isInboxOrCategory = mailParams.labelID === MAILBOX_LABEL_IDS.INBOX || isCategoryLabel(mailParams.labelID);

    return {
        ...categoriesData,
        shouldShowTabs: isInboxOrCategory && categoriesData.categoryViewAccess,
    };
};
