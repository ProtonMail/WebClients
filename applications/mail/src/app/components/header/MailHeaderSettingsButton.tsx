import React from 'react';

import { c } from 'ttag';

import { DropdownMenuButton, Tooltip, useModalState } from '@proton/components/components';
import {
    MailComposerModeModal,
    MailDensityModal,
    MailShortcutsModal,
    MailViewLayoutModal,
    TopNavbarListItemSettingsDropdown,
} from '@proton/components/containers';
import { useMailSettings, useUserSettings } from '@proton/components/hooks';
import { APPS, COMPOSER_MODE, DENSITY, VIEW_LAYOUT } from '@proton/shared/lib/constants';
import { isFirefox } from '@proton/shared/lib/helpers/browser';

import { useEncryptedSearchContext } from '../../containers/EncryptedSearchProvider';
import ClearBrowserDataModal from './ClearBrowserDataModal';
import MailDefaultHandlerModal from './MailDefaultHandlerModal';

const MailHeaderSettingsButton = () => {
    const [{ Density }] = useUserSettings();
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
            <TopNavbarListItemSettingsDropdown to="/mail" toApp={APPS.PROTONACCOUNT}>
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
                {clearDataButton}
            </TopNavbarListItemSettingsDropdown>
            <MailShortcutsModal {...mailShortcutsProps} />
            <MailViewLayoutModal {...mailViewLayoutProps} />
            <MailDensityModal {...mailDensityProps} />
            <MailComposerModeModal {...mailComposerModeProps} />
            <MailDefaultHandlerModal {...mailDefaultHandlerProps} />
            <ClearBrowserDataModal {...clearBrowserDataProps} />
        </>
    );
};

export default MailHeaderSettingsButton;
