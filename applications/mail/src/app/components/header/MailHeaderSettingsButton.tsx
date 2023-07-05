import { c } from 'ttag';

import { NotificationDot } from '@proton/atoms/NotificationDot';
import { DropdownMenuButton, Tooltip, useModalState } from '@proton/components/components';
import { KeyTransparencyDetailsModal } from '@proton/components/components/keyTransparency';
import {
    MailComposerModeModal,
    MailDensityModal,
    MailShortcutsModal,
    MailViewLayoutModal,
    TopNavbarListItemSettingsDropdown,
    useKeyTransparencyContext,
} from '@proton/components/containers';
import { useMailSettings, useUserSettings } from '@proton/components/hooks';
import useKeyTransparencyNotification from '@proton/components/hooks/useKeyTransparencyNotification';
import { APPS, COMPOSER_MODE, DENSITY, VIEW_LAYOUT } from '@proton/shared/lib/constants';
import { isFirefox } from '@proton/shared/lib/helpers/browser';
import { KeyTransparencyActivation } from '@proton/shared/lib/interfaces';

import { useEncryptedSearchContext } from '../../containers/EncryptedSearchProvider';
import ClearBrowserDataModal from './ClearBrowserDataModal';
import MailDefaultHandlerModal from './MailDefaultHandlerModal';
import OnboardingChecklistModal from './OnboardingChecklistModal';

const MailHeaderSettingsButton = () => {
    const [{ Density, Checklists }] = useUserSettings();
    const [{ Shortcuts, ComposerMode, ViewLayout } = { Shortcuts: 0, ComposerMode: 0, ViewLayout: 0 }] =
        useMailSettings();
    const { getESDBStatus } = useEncryptedSearchContext();
    const { dbExists, esEnabled } = getESDBStatus();

    const [clearBrowserDataProps, setClearBrowserDataModalOpen] = useModalState();
    const [mailShortcutsProps, setMailShortcutsModalOpen] = useModalState();
    const [mailViewLayoutProps, setMailViewLayoutModalOpen] = useModalState();
    const [mailDensityProps, setMailDensityModalOpen] = useModalState();
    const [mailComposerModeProps, setMailComposerModeModalOpen] = useModalState();
    const [mailDefaultHandlerProps, setDefaultHandlerModalOpen] = useModalState();
    const [onboardingChecklistProps, setOnboardingChecklistProps] = useModalState();

    const hasFreeOnboardingChecklist = Checklists?.includes('get-started');

    const [keyTransparencyDetailsModalProps, setKeyTransparencyDetailsModalOpen] = useModalState();
    const { ktActivation } = useKeyTransparencyContext();
    const keyTransparencyNotification = useKeyTransparencyNotification();
    const showKT = ktActivation === KeyTransparencyActivation.SHOW_UI;

    const clearDataButton =
        dbExists || esEnabled ? (
            <>
                <hr className="my-2" />
                <Tooltip
                    title={c('Info')
                        .t`Clears browser data related to message content search including downloaded messages`}
                >
                    <DropdownMenuButton
                        onClick={() => setClearBrowserDataModalOpen(true)}
                        className="flex flex-nowrap flex-justify-center"
                    >
                        <span className="color-weak">{c('Action').t`Clear browser data`}</span>
                    </DropdownMenuButton>
                </Tooltip>
            </>
        ) : null;

    return (
        <>
            <TopNavbarListItemSettingsDropdown
                to="/mail"
                toApp={APPS.PROTONACCOUNT}
                notificationDotColor={keyTransparencyNotification}
            >
                <hr className="my-2" />
                <DropdownMenuButton
                    onClick={() => setMailShortcutsModalOpen(true)}
                    className="flex flex-nowrap flex-justify-space-between flex-align-items-center"
                >
                    <span className="flex-item-fluid text-left">{c('Action').t`Keyboard shortcuts`}</span>
                    <span className="color-primary ml-2">
                        {Shortcuts ? c('Keyboard Shortcuts Enabled').t`On` : c('Keyboard Shortcuts Disabled').t`Off`}
                    </span>
                </DropdownMenuButton>
                <DropdownMenuButton
                    onClick={() => setMailViewLayoutModalOpen(true)}
                    className="flex flex-nowrap flex-justify-space-between flex-align-items-center no-mobile"
                >
                    <span className="flex-item-fluid text-left">{c('Action').t`Mailbox layout`}</span>
                    <span className="color-primary ml-2">
                        {ViewLayout === VIEW_LAYOUT.COLUMN ? c('Layout mode').t`Column` : c('Layout mode').t`Row`}
                    </span>
                </DropdownMenuButton>
                <DropdownMenuButton
                    onClick={() => setMailDensityModalOpen(true)}
                    className="flex flex-nowrap flex-justify-space-between flex-align-items-center"
                >
                    <span className="flex-item-fluid text-left">{c('Action').t`Mailbox density`}</span>
                    <span className="color-primary flex-item-noshrink ml-2">
                        {Density === DENSITY.COMFORTABLE
                            ? c('Density mode').t`Comfortable`
                            : c('Density mode').t`Compact`}
                    </span>
                </DropdownMenuButton>
                <DropdownMenuButton
                    onClick={() => setMailComposerModeModalOpen(true)}
                    className="flex flex-nowrap flex-justify-space-between flex-align-items-center no-mobile"
                >
                    <span className="flex-item-fluid text-left">{c('Action').t`Composer size`}</span>
                    <span className="color-primary ml-2">
                        {ComposerMode === COMPOSER_MODE.MAXIMIZED
                            ? c('Composer size').t`Maximized`
                            : c('Composer size').t`Normal`}
                    </span>
                </DropdownMenuButton>
                {isFirefox() && (
                    <DropdownMenuButton
                        onClick={() => setDefaultHandlerModalOpen(true)}
                        className="flex flex-nowrap flex-justify-space-between flex-align-items-center no-mobile"
                    >
                        <span className="flex-item-fluid text-left">{c('Action').t`Default email application`}</span>
                    </DropdownMenuButton>
                )}
                {showKT && (
                    <>
                        <hr className="my-2" />
                        <DropdownMenuButton
                            onClick={() => setKeyTransparencyDetailsModalOpen(true)}
                            className="flex flex-nowrap flex-justify-space-between flex-align-items-center"
                        >
                            {c('loc_nightly: Key transparency details').t`Key verification`}
                            {keyTransparencyNotification && (
                                <NotificationDot
                                    className="ml-4"
                                    color={keyTransparencyNotification}
                                    alt={c('Action').t`Attention required`}
                                />
                            )}
                        </DropdownMenuButton>
                    </>
                )}
                {hasFreeOnboardingChecklist && (
                    <>
                        <hr className="my-2" />
                        <DropdownMenuButton
                            onClick={() => setOnboardingChecklistProps(true)}
                            className="flex flex-nowrap flex-justify-space-between flex-align-items-center"
                        >
                            <span className="flex-item-fluid text-left">
                                {c('Get started checklist instructions').t`Open checklist`}
                            </span>
                            <span className="color-primary ml-2">
                                {c('Get started checklist instructions').t`Get free storage`}
                            </span>
                        </DropdownMenuButton>
                    </>
                )}
                {clearDataButton}
            </TopNavbarListItemSettingsDropdown>
            <MailShortcutsModal {...mailShortcutsProps} />
            <MailViewLayoutModal {...mailViewLayoutProps} />
            <MailDensityModal {...mailDensityProps} />
            <MailComposerModeModal {...mailComposerModeProps} />
            <MailDefaultHandlerModal {...mailDefaultHandlerProps} />
            <ClearBrowserDataModal {...clearBrowserDataProps} />
            <KeyTransparencyDetailsModal {...keyTransparencyDetailsModalProps} />
            <OnboardingChecklistModal {...onboardingChecklistProps} />
        </>
    );
};

export default MailHeaderSettingsButton;
