import { Ref, forwardRef, memo, useRef } from 'react';
import { Redirect, useRouteMatch } from 'react-router-dom';

import {
    CalendarDrawerAppButton,
    ContactDrawerAppButton,
    FeatureCode,
    LocationErrorBoundary,
    MailShortcutsModal,
    useDrawer,
    useFeatures,
    useFolders,
    useLabels,
    useMailSettings,
    useModalState,
    useUserSettings,
    useWelcomeFlags,
} from '@proton/components';
import { MailSettings, UserSettings } from '@proton/shared/lib/interfaces';
import { Label } from '@proton/shared/lib/interfaces/Label';
import isTruthy from '@proton/utils/isTruthy';

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
    const { showDrawerSidebar } = useDrawer();

    const [{ feature: drawerFeature }, { feature: runLegacyMessageFeature }] = useFeatures([
        FeatureCode.Drawer,
        FeatureCode.LegacyMessageMigrationEnabled,
    ]);

    const runLegacyMessageMigration = runLegacyMessageFeature?.Value;

    useContactsListener();
    useConversationsEvent();
    useMessagesEvents();

    const drawerSpotlightSeenRef = useRef(false);
    const markSpotlightAsSeen = () => {
        if (drawerSpotlightSeenRef) {
            drawerSpotlightSeenRef.current = true;
        }
    };

    const drawerSidebarButtons = [
        drawerFeature?.Value.ContactsInMail && <ContactDrawerAppButton onClick={markSpotlightAsSeen} />,
        drawerFeature?.Value.CalendarInMail && <CalendarDrawerAppButton onClick={markSpotlightAsSeen} />,
    ].filter(isTruthy);

    const canShowDrawer = drawerSidebarButtons.length > 0;

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
            drawerSidebarButtons={drawerSidebarButtons}
            drawerSpotlightSeenRef={drawerSpotlightSeenRef}
            showDrawerSidebar={showDrawerSidebar}
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
                    toolbarBordered={canShowDrawer && showDrawerSidebar}
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
