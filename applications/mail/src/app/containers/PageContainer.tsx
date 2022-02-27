import { forwardRef, memo, Ref, useEffect, useRef } from 'react';
import { APPS } from '@proton/shared/lib/constants';
import { Redirect, useRouteMatch } from 'react-router-dom';
import {
    useMailSettings,
    useUserSettings,
    useLabels,
    useFolders,
    useWelcomeFlags,
    useModals,
    LocationErrorBoundary,
    MailShortcutsModal,
    useModalState,
    ReferralModal,
    useSubscription,
    useUser,
    useFeature,
    FeatureCode,
    getShouldOpenReferralModal,
    useAddresses,
    getShouldOpenMnemonicModal,
} from '@proton/components';
import { Label } from '@proton/shared/lib/interfaces/Label';
import { MailSettings } from '@proton/shared/lib/interfaces';
import { MnemonicPromptModal } from '@proton/components/containers/mnemonic';
import PrivateLayout from '../components/layout/PrivateLayout';
import MailboxContainer from './mailbox/MailboxContainer';
import { HUMAN_TO_LABEL_IDS } from '../constants';
import { Breakpoints } from '../models/utils';
import { useDeepMemo } from '../hooks/useDeepMemo';
import MailOnboardingModal from '../components/onboarding/MailOnboardingModal';
import { MailUrlParams } from '../helpers/mailboxUrl';
import { useContactsListener } from '../hooks/contact/useContactsListener';
import { usePageHotkeys } from '../hooks/mailbox/usePageHotkeys';
import { useConversationsEvent } from '../hooks/events/useConversationsEvents';
import { useMessagesEvents } from '../hooks/events/useMessagesEvents';

interface Props {
    params: MailUrlParams;
    breakpoints: Breakpoints;
    isComposerOpened: boolean;
}

const PageContainer = (
    { params: { elementID, labelID, messageID }, breakpoints, isComposerOpened }: Props,
    ref: Ref<HTMLDivElement>
) => {
    const [user] = useUser();
    const [mailSettings] = useMailSettings();
    const [userSettings] = useUserSettings();
    const [subscription] = useSubscription();
    const [addresses] = useAddresses();

    const { createModal } = useModals();

    const seenMnemonicFeature = useFeature<boolean>(FeatureCode.SeenMnemonicPrompt);
    const [mnemonicPromptModal, setMnemonicPromptModalOpen, renderMnemonicModal] = useModalState();
    const shouldOpenMnemonicModal = getShouldOpenMnemonicModal({
        user,
        addresses,
        feature: seenMnemonicFeature.feature,
        app: APPS.PROTONMAIL,
    });

    const seenReferralModal = useFeature<boolean>(FeatureCode.SeenReferralModal);
    const [referralModal, setReferralModal, renderReferralModal] = useModalState();
    const shouldOpenReferralModal = getShouldOpenReferralModal({ subscription, feature: seenReferralModal.feature });

    const [welcomeFlags, setWelcomeFlagsDone] = useWelcomeFlags();
    const onceRef = useRef(false);

    useEffect(() => {
        if (onceRef.current) {
            return;
        }

        if (welcomeFlags.isWelcomeFlow) {
            onceRef.current = true;
            createModal(
                <MailOnboardingModal
                    onDone={() => {
                        setWelcomeFlagsDone();
                    }}
                />
            );
        } else if (shouldOpenMnemonicModal) {
            onceRef.current = true;
            setMnemonicPromptModalOpen(true);
        } else if (shouldOpenReferralModal.open) {
            onceRef.current = true;
            setReferralModal(true);
        }
    }, [shouldOpenMnemonicModal, shouldOpenReferralModal.open]);

    useContactsListener();
    useConversationsEvent();
    useMessagesEvents();

    const handleOpenShortcutsModal = () => {
        createModal(<MailShortcutsModal />, 'shortcuts-modal');
    };

    usePageHotkeys({ onOpenShortcutsModal: handleOpenShortcutsModal });

    if (!labelID) {
        return <Redirect to="/inbox" />;
    }

    return (
        <PrivateLayout
            ref={ref}
            isBlurred={welcomeFlags.isWelcomeFlow}
            labelID={labelID}
            elementID={elementID}
            breakpoints={breakpoints}
        >
            {renderReferralModal && <ReferralModal endDate={shouldOpenReferralModal.endDate} {...referralModal} />}
            {renderMnemonicModal && <MnemonicPromptModal {...mnemonicPromptModal} />}
            <LocationErrorBoundary>
                <MailboxContainer
                    labelID={labelID}
                    userSettings={userSettings}
                    mailSettings={mailSettings as MailSettings}
                    breakpoints={breakpoints}
                    elementID={elementID}
                    messageID={messageID}
                    isComposerOpened={isComposerOpened}
                />
            </LocationErrorBoundary>
        </PrivateLayout>
    );
};

const MemoPageContainer = memo(forwardRef(PageContainer));

interface PageParamsParserProps {
    breakpoints: Breakpoints;
    isComposerOpened: boolean;
}

const PageParamsParser = (props: PageParamsParserProps, ref: Ref<HTMLDivElement>) => {
    const [labels = []] = useLabels();
    const [folders = []] = useFolders();
    const match = useRouteMatch<MailUrlParams>();

    const params = useDeepMemo(() => {
        const labelIDs = [...labels, ...folders].map(({ ID }: Label) => ID);
        const { elementID, labelID: currentLabelID = '', messageID } = (match || {}).params || {};
        const labelID = HUMAN_TO_LABEL_IDS[currentLabelID] || (labelIDs.includes(currentLabelID) && currentLabelID);
        return { elementID, labelID, messageID };
    }, [match]);

    return <MemoPageContainer ref={ref} {...props} params={params} />;
};
export default forwardRef(PageParamsParser);
