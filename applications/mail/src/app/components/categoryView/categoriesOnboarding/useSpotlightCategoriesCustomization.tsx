import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { useWelcomeFlags } from '@proton/account/welcomeFlags';
import { Button } from '@proton/atoms/Button/Button';
import { useSpotlightOnFeature, useSpotlightShow } from '@proton/components';
import { FeatureCode } from '@proton/features/interface';
import { IcSliders2 } from '@proton/icons/icons/IcSliders2';
import { useConversationCounts } from '@proton/mail/store/counts/conversationCountsSlice';
import { useMessageCounts } from '@proton/mail/store/counts/messageCountsSlice';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

import { getLocationElementsCount } from 'proton-mail/helpers/elements';
import { isConversationMode } from 'proton-mail/helpers/mailSettings';

const REQUIRED_NUMBER_OF_MAILS = 100;

interface Props {
    showEditModal: () => void;
}

/**
 * Free users should be shown the spotlight if they have more than 100 mails.
 */
export const useSpotlightCategoriesCustomization = ({ showEditModal }: Props) => {
    const [user, loadingUser] = useUser();
    const [mailSettings, loadingMailSettings] = useMailSettings();
    const [messageCounts = [], messageCountsLoading] = useMessageCounts();
    const [conversationCounts = [], conversationCountsLoading] = useConversationCounts();
    const welcomeFlagsData = useWelcomeFlags();

    const loading = loadingUser || loadingMailSettings || messageCountsLoading || conversationCountsLoading;

    const allMailsElementsCount = getLocationElementsCount(
        MAILBOX_LABEL_IDS.ALL_MAIL,
        conversationCounts,
        messageCounts,
        isConversationMode(MAILBOX_LABEL_IDS.ALL_MAIL, mailSettings)
    );

    const spotlightData = useSpotlightOnFeature(
        FeatureCode.CategoryViewEditReminderSpotlight,
        welcomeFlagsData.welcomeFlags.isDone &&
            !user.hasPaidMail &&
            allMailsElementsCount >= REQUIRED_NUMBER_OF_MAILS &&
            !loading
    );

    const shouldShowSpotlight = useSpotlightShow(spotlightData.show, 3000);

    const handleNotNow = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        spotlightData.onDisplayed();
        spotlightData.onClose();
    };

    const handleCustomize = (e: React.MouseEvent<HTMLButtonElement>) => {
        handleNotNow(e);
        showEditModal();
    };

    const menuIcon = <IcSliders2 key="menuIcon" alt={c('Action').t`Edit categories`} />;
    const spotlightContent = (
        <div>
            <h2 className="text-semibold text-rg mb-2">{c('Title').t`Customize categories to fit your needs`}</h2>
            <p className="m-0 color-weak">{c('Label')
                .jt`Add or remove categories. Set or turn off notifications. Adjust anytime in the ${menuIcon} menu.`}</p>
            <div className="flex gap-2 my-3">
                <Button size="tiny" onClick={handleCustomize} className="flex-1" color="norm">{c('Action')
                    .t`Customize categories`}</Button>
                <Button size="tiny" onClick={handleNotNow} className="flex-1">{c('Action').t`Not now`}</Button>
            </div>
        </div>
    );

    return {
        spotlightContent,
        shouldShowSpotlight,
        onDisplayed: spotlightData.onDisplayed,
        onClose: spotlightData.onClose,
    };
};
