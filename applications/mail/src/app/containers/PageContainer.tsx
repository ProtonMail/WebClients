import { forwardRef, memo, Ref, useEffect, useRef } from 'react';
import { Redirect, useRouteMatch, useHistory, useLocation } from 'react-router-dom';
import {
    FeatureCode,
    useMailSettings,
    useUserSettings,
    useLabels,
    useFeature,
    useFolders,
    useWelcomeFlags,
    useModals,
    LocationErrorBoundary,
    MailShortcutsModal,
    BetaOnboardingModal,
    useIsMnemonicAvailable,
    useUser,
} from '@proton/components';
import { Label } from '@proton/shared/lib/interfaces/Label';
import { MailSettings, MNEMONIC_STATUS } from '@proton/shared/lib/interfaces';
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
    const location = useLocation();
    const history = useHistory();
    const [mailSettings] = useMailSettings();
    const [userSettings] = useUserSettings();
    const { createModal } = useModals();
    const [welcomeFlags, setWelcomeFlagsDone] = useWelcomeFlags();
    const [isMnemonicAvailable] = useIsMnemonicAvailable();
    const [user] = useUser();
    const onceRef = useRef(false);
    const { feature: hasSeenMnemonicPrompt } = useFeature(FeatureCode.SeenMnemonicPrompt);

    useEffect(() => {
        if (onceRef.current) {
            return;
        }
        const queryParams = new URLSearchParams(location.search);

        const hasBetaParam = queryParams.has('beta');
        if (hasBetaParam) {
            queryParams.delete('beta');
            history.replace({
                search: queryParams.toString(),
            });
        }

        // userSettings is used to avoid waiting to load features from useEarlyAccess
        const shouldOpenBetaOnboardingModal = hasBetaParam && !userSettings.EarlyAccess;

        const shouldOpenMnemonicPrompt =
            isMnemonicAvailable &&
            user.MnemonicStatus === MNEMONIC_STATUS.PROMPT &&
            hasSeenMnemonicPrompt?.Value === false;

        if (welcomeFlags.isWelcomeFlow) {
            onceRef.current = true;
            createModal(
                <MailOnboardingModal
                    onDone={() => {
                        if (shouldOpenBetaOnboardingModal) {
                            createModal(
                                <BetaOnboardingModal
                                    onClose={() => {
                                        setWelcomeFlagsDone();
                                    }}
                                />
                            );
                        } else {
                            setWelcomeFlagsDone();
                        }
                    }}
                />
            );
        } else if (shouldOpenBetaOnboardingModal) {
            onceRef.current = true;
            createModal(<BetaOnboardingModal />);
        } else if (shouldOpenMnemonicPrompt) {
            onceRef.current = true;
            createModal(<MnemonicPromptModal />);
        }
    }, [isMnemonicAvailable, hasSeenMnemonicPrompt]);

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
