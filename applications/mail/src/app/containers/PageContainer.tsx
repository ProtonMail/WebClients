import React, { forwardRef, memo, Ref, useEffect } from 'react';
import { Redirect, useRouteMatch, useHistory, useLocation } from 'react-router-dom';
import {
    useMailSettings,
    useUserSettings,
    useLabels,
    useFolders,
    useWelcomeFlags,
    useModals,
    LocationErrorBoundary,
    MailShortcutsModal,
    BetaOnboardingModal,
} from 'react-components';
import { Label } from 'proton-shared/lib/interfaces/Label';
import { MailSettings } from 'proton-shared/lib/interfaces';
import PrivateLayout from '../components/layout/PrivateLayout';
import MailboxContainer from './mailbox/MailboxContainer';
import { HUMAN_TO_LABEL_IDS } from '../constants';
import { Breakpoints } from '../models/utils';
import { useLinkHandler } from '../hooks/useLinkHandler';
import { OnCompose } from '../hooks/composer/useCompose';
import { useDeepMemo } from '../hooks/useDeepMemo';
import MailOnboardingModal from '../components/onboarding/MailOnboardingModal';
import { MailUrlParams } from '../helpers/mailboxUrl';
import { useContactsListener } from '../hooks/contact/useContactsListener';
import { usePageHotkeys } from '../hooks/mailbox/usePageHotkeys';

interface Props {
    params: MailUrlParams;
    breakpoints: Breakpoints;
    onCompose: OnCompose;
    isComposerOpened: boolean;
}

const PageContainer = (
    { params: { elementID, labelID, messageID }, breakpoints, onCompose, isComposerOpened }: Props,
    ref: Ref<HTMLDivElement>
) => {
    const location = useLocation();
    const history = useHistory();
    const [mailSettings] = useMailSettings();
    const [userSettings] = useUserSettings();
    const { createModal } = useModals();
    const [welcomeFlags, setWelcomeFlagsDone] = useWelcomeFlags();

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);

        const shouldOpenBetaOnboardingModal = queryParams.has('beta');
        if (shouldOpenBetaOnboardingModal) {
            queryParams.delete('beta');
            history.replace({
                search: queryParams.toString(),
            });
        }

        if (welcomeFlags.isWelcomeFlow) {
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
            createModal(<BetaOnboardingModal />);
        }
    }, []);

    useLinkHandler(onCompose);
    useContactsListener();

    const handleOpenShortcutsModal = () => {
        createModal(<MailShortcutsModal />, 'shortcuts-modal');
    };

    usePageHotkeys({ onCompose, onOpenShortcutsModal: handleOpenShortcutsModal });

    if (!labelID) {
        return <Redirect to="/inbox" />;
    }

    return (
        <PrivateLayout
            ref={ref}
            isBlurred={welcomeFlags.isWelcomeFlow}
            labelID={labelID}
            elementID={elementID}
            location={location}
            history={history}
            breakpoints={breakpoints}
            onCompose={onCompose}
        >
            <LocationErrorBoundary>
                <MailboxContainer
                    labelID={labelID}
                    userSettings={userSettings}
                    mailSettings={mailSettings as MailSettings}
                    breakpoints={breakpoints}
                    elementID={elementID}
                    messageID={messageID}
                    location={location}
                    history={history}
                    onCompose={onCompose}
                    isComposerOpened={isComposerOpened}
                />
            </LocationErrorBoundary>
        </PrivateLayout>
    );
};

const MemoPageContainer = memo(forwardRef(PageContainer));

interface PageParamsParserProps {
    breakpoints: Breakpoints;
    onCompose: OnCompose;
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
