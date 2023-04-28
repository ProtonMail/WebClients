import { memo } from 'react';
import { useLocation } from 'react-router-dom';

import {
    FloatingButton,
    Icon,
    PrivateHeader,
    RebrandingFeedbackModal,
    TopNavbarListItemContactsDropdown,
    TopNavbarListItemFeedbackButton,
    UserDropdown,
    useFolders,
    useHasRebrandingFeedback,
    useLabels,
    useModalState,
} from '@proton/components';
import useDisplayContactsWidget from '@proton/components/hooks/useDisplayContactsWidget';
import { Recipient } from '@proton/shared/lib/interfaces';

import { MESSAGE_ACTIONS } from '../../constants';
import { useOnCompose, useOnMailTo } from '../../containers/ComposeProvider';
import { getLabelName } from '../../helpers/labels';
import { setParamsInUrl } from '../../helpers/mailboxUrl';
import { ComposeTypes } from '../../hooks/composer/useCompose';
import { Breakpoints } from '../../models/utils';
import MailOnboardingModal from '../onboarding/MailOnboardingModal';
import MailHeaderSettingsButton from './MailHeaderSettingsButton';
import MailSearch from './search/MailSearch';

interface Props {
    labelID: string;
    elementID: string | undefined;
    breakpoints: Breakpoints;
    expanded?: boolean;
    onToggleExpand: () => void;
}

const MailHeader = ({ labelID, elementID, breakpoints, expanded, onToggleExpand }: Props) => {
    const location = useLocation();
    const [labels = []] = useLabels();
    const [folders = []] = useFolders();
    const hasRebrandingFeedback = useHasRebrandingFeedback();

    const displayContactsInHeader = useDisplayContactsWidget();

    const onCompose = useOnCompose();
    const onMailTo = useOnMailTo();

    const [onboardingModalProps, setOnboardingModalOpen, renderOnboardingModal] = useModalState();
    const [feedbackModalProps, setFeedbackModalOpen] = useModalState();

    const handleContactsCompose = (emails: Recipient[], attachments: File[]) => {
        onCompose({
            type: ComposeTypes.newMessage,
            action: MESSAGE_ACTIONS.NEW,
            referenceMessage: { data: { ToList: emails }, draftFlags: { initialAttachments: attachments } },
        });
    };

    const backUrl = setParamsInUrl(location, { labelID });
    const showBackButton = breakpoints.isNarrow && elementID;
    const labelName = getLabelName(labelID, labels, folders);

    return (
        <>
            <PrivateHeader
                userDropdown={<UserDropdown onOpenIntroduction={() => setOnboardingModalOpen(true)} />}
                backUrl={showBackButton && backUrl ? backUrl : undefined}
                title={labelName}
                settingsButton={<MailHeaderSettingsButton />}
                contactsButton={
                    displayContactsInHeader && (
                        <TopNavbarListItemContactsDropdown onCompose={handleContactsCompose} onMailTo={onMailTo} />
                    )
                }
                feedbackButton={
                    hasRebrandingFeedback ? (
                        <TopNavbarListItemFeedbackButton onClick={() => setFeedbackModalOpen(true)} />
                    ) : null
                }
                searchBox={<MailSearch breakpoints={breakpoints} labelID={labelID} location={location} />}
                searchDropdown={<MailSearch breakpoints={breakpoints} labelID={labelID} location={location} />}
                expanded={!!expanded}
                onToggleExpand={onToggleExpand}
                isNarrow={breakpoints.isNarrow}
                floatingButton={
                    <FloatingButton
                        onClick={() => onCompose({ type: ComposeTypes.newMessage, action: MESSAGE_ACTIONS.NEW })}
                    >
                        <Icon size={24} name="pen" className="m-auto" />
                    </FloatingButton>
                }
            />
            {renderOnboardingModal && <MailOnboardingModal showGenericSteps {...onboardingModalProps} />}
            <RebrandingFeedbackModal {...feedbackModalProps} />
        </>
    );
};

export default memo(MailHeader);
