import { Ref, forwardRef, memo } from 'react';
import { Redirect, useRouteMatch } from 'react-router-dom';

import {
    FeatureCode,
    MailShortcutsModal,
    useFeatures,
    useFolders,
    useLabels,
    useModalState,
    useOpenDrawerOnLoad,
    useUserSettings,
} from '@proton/components';
import { UserSettings } from '@proton/shared/lib/interfaces';
import { Label } from '@proton/shared/lib/interfaces/Label';

import useMailModel from 'proton-mail/hooks/useMailModel';

import PrivateLayout from '../components/layout/PrivateLayout';
import MailOnboardingWrapper from '../components/onboarding/MailOnboardingWrapper';
import { LabelActionsContextProvider } from '../components/sidebar/EditLabelContext';
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
import MailboxContainer from './mailbox/MailboxContainer';

interface Props {
    params: MailUrlParams;
    breakpoints: Breakpoints;
}

const PageContainer = ({ params: { elementID, labelID, messageID }, breakpoints }: Props, ref: Ref<HTMLDivElement>) => {
    const [userSettings] = useUserSettings();
    const mailSettings = useMailModel('MailSettings');
    const [mailShortcutsProps, setMailShortcutsModalOpen] = useModalState();

    useOpenDrawerOnLoad();
    const { getFeature } = useFeatures([FeatureCode.LegacyMessageMigrationEnabled]);
    const { feature: runLegacyMessageFeature } = getFeature(FeatureCode.LegacyMessageMigrationEnabled);

    const runLegacyMessageMigration = runLegacyMessageFeature?.Value;

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

    return (
        <PrivateLayout ref={ref} labelID={labelID} elementID={elementID} breakpoints={breakpoints}>
            <MailOnboardingWrapper />
            {runLegacyMessageMigration && <LegacyMessagesMigrationContainer />}
            <LabelActionsContextProvider>
                <MailboxContainer
                    labelID={labelID}
                    mailSettings={mailSettings}
                    userSettings={userSettings as UserSettings}
                    breakpoints={breakpoints}
                    elementID={elementID}
                    messageID={messageID}
                />
            </LabelActionsContextProvider>
            <MailShortcutsModal {...mailShortcutsProps} />
        </PrivateLayout>
    );
};

const MemoPageContainer = memo(forwardRef(PageContainer));

interface PageParamsParserProps {
    breakpoints: Breakpoints;
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
