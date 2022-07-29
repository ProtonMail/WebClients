import { memo, useCallback, useState } from 'react';

import { c } from 'ttag';

import {
    FeatureCode,
    MainLogo,
    Sidebar,
    SidebarNav,
    SidebarPrimaryButton,
    Spotlight,
    Tooltip,
    useMailSettings,
    useModalState,
    useSpotlightOnFeature,
    useSpotlightShow,
    useUserSettings,
} from '@proton/components';
import { MnemonicPromptModal } from '@proton/components/containers/mnemonic';
import giftSvg from '@proton/styles/assets/img/illustrations/gift.svg';

import { MESSAGE_ACTIONS } from '../../constants';
import { useOnCompose } from '../../containers/ComposeProvider';
import { useGetStartedChecklist } from '../../containers/checklists';
import MailGetStartedChecklistModal from '../checklist/GetStartedChecklistModal';
import MailSidebarList from './MailSidebarList';
import SidebarVersion from './SidebarVersion';

interface Props {
    labelID: string;
    expanded?: boolean;
    onToggleExpand: () => void;
    onSendMessage?: () => void;
}

const MailSidebar = ({ labelID, expanded = false, onToggleExpand, onSendMessage }: Props) => {
    const onCompose = useOnCompose();
    const [userSettings] = useUserSettings();
    const { show, onDisplayed } = useSpotlightOnFeature(FeatureCode.SpotlightGetStartedChecklist);
    const { dismissed: getStartedChecklistDismissed } = useGetStartedChecklist();
    const handleCompose = useCallback(() => {
        onCompose({ action: MESSAGE_ACTIONS.NEW });
    }, [onCompose]);
    const [{ Shortcuts = 0 } = {}] = useMailSettings();

    const [mailGetStartedChecklistModalOpen, setMailGetStartedChecklistModalOpen] = useState(false);
    const [mnemonicPromptModal, setMnemonicPromptModalOpen] = useModalState();

    const handleGiftClick = () => {
        setMailGetStartedChecklistModalOpen(true);
    };

    const titlePrimaryButton = Shortcuts ? (
        <>
            {c('Title').t`New message`}
            <br />
            <kbd className="border-none">N</kbd>
        </>
    ) : null;

    const sideBarPrimaryButton = Shortcuts ? (
        <Tooltip title={titlePrimaryButton} originalPlacement="top">
            <SidebarPrimaryButton className="no-mobile" onClick={handleCompose} data-testid="sidebar:compose">
                {c('Action').t`New message`}
            </SidebarPrimaryButton>
        </Tooltip>
    ) : (
        <SidebarPrimaryButton className="no-mobile" onClick={handleCompose} data-testid="sidebar:compose">
            {c('Action').t`New message`}
        </SidebarPrimaryButton>
    );

    const shouldShowSpotlight = useSpotlightShow(getStartedChecklistDismissed && show);

    return (
        <>
            <Sidebar
                expanded={expanded}
                onToggleExpand={onToggleExpand}
                primary={sideBarPrimaryButton}
                logo={<MainLogo to="/inbox" />}
                version={<SidebarVersion />}
                storageGift={
                    userSettings.Checklists?.includes('get-started') && (
                        <Spotlight
                            content={c('Get started checklist spotlight')
                                .t`You can access the checklist anytime from here`}
                            show={shouldShowSpotlight}
                            onDisplayed={onDisplayed}
                            originalPlacement="top"
                        >
                            <button type="button" className="ml0-5" onClick={handleGiftClick}>
                                <Tooltip title={c('Storage').t`Get extra storage for free`}>
                                    <img
                                        width={16}
                                        src={giftSvg}
                                        alt={c('Action').t`Open get started checklist modal`}
                                    />
                                </Tooltip>
                            </button>
                        </Spotlight>
                    )
                }
            >
                <SidebarNav>
                    <MailSidebarList labelID={labelID} />
                </SidebarNav>
            </Sidebar>

            <MailGetStartedChecklistModal
                open={mailGetStartedChecklistModalOpen}
                onClose={() => setMailGetStartedChecklistModalOpen(false)}
                onMnemonicItemSelection={() => setMnemonicPromptModalOpen(true)}
                onSendMessage={() => {
                    handleCompose();
                    onSendMessage?.();
                }}
            />

            <MnemonicPromptModal {...mnemonicPromptModal} />
        </>
    );
};

export default memo(MailSidebar);
