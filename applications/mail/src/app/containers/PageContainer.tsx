import { Ref, forwardRef, memo } from 'react';
import { Redirect, useRouteMatch } from 'react-router-dom';

import {
    FeatureCode,
    LocationErrorBoundary,
    MailShortcutsModal,
    useFeature,
    useFolders,
    useLabels,
    useMailSettings,
    useModalState,
    useUserSettings,
    useWelcomeFlags,
} from '@proton/components';
import { MailSettings, UserSettings } from '@proton/shared/lib/interfaces';
import { Label } from '@proton/shared/lib/interfaces/Label';

import PrivateLayout from '../components/layout/PrivateLayout';
import { HUMAN_TO_LABEL_IDS } from '../constants';
import { MailUrlParams } from '../helpers/mailboxUrl';
import { useContactsListener } from '../hooks/contact/useContactsListener';
import { useConversationsEvent } from '../hooks/events/useConversationsEvents';
import { useMessagesEvents } from '../hooks/events/useMessagesEvents';
import useIncomingDefaultsEvents from '../hooks/incomingDefaults/useIncomingDefaultsEvents';
import useIncomingDefaultsLoad from '../hooks/incomingDefaults/useIncomingDefaultsLoad';
import { usePageHotkeys } from '../hooks/mailbox/usePageHotkeys';
import { useDeepMemo } from '../hooks/useDeepMemo';
import { Breakpoints } from '../models/utils';
import LegacyMessagesMigrationContainer from './LegacyMessagesMigrationContainer';
import MailStartupModals from './MailStartupModals';
import MailboxContainer from './mailbox/MailboxContainer';

interface Props {
    params: MailUrlParams;
    breakpoints: Breakpoints;
    isComposerOpened: boolean;
}

const PageContainer = (
    { params: { elementID, labelID, messageID }, breakpoints, isComposerOpened }: Props,
    ref: Ref<HTMLDivElement>
) => {
    const [userSettings] = useUserSettings();
    const [mailSettings] = useMailSettings();
    const [welcomeFlags, setWelcomeFlagsDone] = useWelcomeFlags();
    const [mailShortcutsProps, setMailShortcutsModalOpen] = useModalState();

    const runLegacyMessageMigration = !!useFeature(FeatureCode.LegacyMessageMigrationEnabled).feature?.Value;

    useContactsListener();
    useConversationsEvent();
    useMessagesEvents();

    /**
     * Incoming defaults
     * - cache loading
     * - events subscription
     */
    useIncomingDefaultsLoad();
    useIncomingDefaultsEvents();

    usePageHotkeys({ onOpenShortcutsModal: () => setMailShortcutsModalOpen(true) });

    if (!labelID) {
        return <Redirect to="/inbox" />;
    }

    const onboardingOpen = !welcomeFlags.isDone;

    return (
        <PrivateLayout
            ref={ref}
            isBlurred={onboardingOpen}
            labelID={labelID}
            elementID={elementID}
            breakpoints={breakpoints}
        >
            <MailStartupModals onboardingOpen={onboardingOpen} onOnboardingDone={() => setWelcomeFlagsDone()} />
            <LocationErrorBoundary>
                {runLegacyMessageMigration && <LegacyMessagesMigrationContainer />}
                <MailboxContainer
                    labelID={labelID}
                    mailSettings={mailSettings as MailSettings}
                    userSettings={userSettings as UserSettings}
                    breakpoints={breakpoints}
                    elementID={elementID}
                    messageID={messageID}
                    isComposerOpened={isComposerOpened}
                />
                <MailShortcutsModal {...mailShortcutsProps} />
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
