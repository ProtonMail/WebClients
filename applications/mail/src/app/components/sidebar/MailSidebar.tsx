import { memo, useCallback, useState } from 'react';

import { c } from 'ttag';

import {
    AppsDropdown,
    FeatureCode,
    MainLogo,
    Sidebar,
    SidebarNav,
    Spotlight,
    Tooltip,
    useModalState,
    useSpotlightOnFeature,
    useSpotlightShow,
    useUserSettings,
} from '@proton/components';
import { MnemonicPromptModal } from '@proton/components/containers/mnemonic';
import { APPS } from '@proton/shared/lib/constants';
import giftSvg from '@proton/styles/assets/img/illustrations/gift.svg';

import { MESSAGE_ACTIONS } from '../../constants';
import { useOnCompose } from '../../containers/ComposeProvider';
import { useGetStartedChecklist } from '../../containers/checklists';
import { ComposeTypes } from '../../hooks/composer/useCompose';
import MailGetStartedChecklistModal from '../checklist/GetStartedChecklistModal';
import MailSidebarList from './MailSidebarList';
import MailSidebarPrimaryButton from './MailSidebarPrimaryButton';
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
        onCompose({ type: ComposeTypes.newMessage, action: MESSAGE_ACTIONS.NEW });
    }, [onCompose]);

    const [mailGetStartedChecklistModalOpen, setMailGetStartedChecklistModalOpen] = useState(false);
    const [mnemonicPromptModal, setMnemonicPromptModalOpen] = useModalState();

    const handleGiftClick = () => {
        setMailGetStartedChecklistModalOpen(true);
    };

    const shouldShowSpotlight = useSpotlightShow(getStartedChecklistDismissed && show);

    const logo = <MainLogo to="/inbox" data-testid="main-logo" />;

    return (
        <>
            <Sidebar
                appsDropdown={<AppsDropdown app={APPS.PROTONMAIL} />}
                expanded={expanded}
                onToggleExpand={onToggleExpand}
                primary={<MailSidebarPrimaryButton handleCompose={handleCompose} />}
                logo={logo}
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
