import React, { useState } from 'react';

import { clsx } from 'clsx';
import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { Avatar, Button, ButtonLike } from '@proton/atoms';
import type { IconName, ModalOwnProps } from '@proton/components';
import { Icon, ModalTwo, ModalTwoContent, SettingsLink, useConfig } from '@proton/components';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import lumoAvatarNeutral from '@proton/styles/assets/img/lumo/lumo-avatar-neutral.svg';
import useFlag from '@proton/unleash/useFlag';

import { useLumoCommon } from '../../../hooks/useLumoCommon';
import { useLumoPlan } from '../../../hooks/useLumoPlan';
import { useLumoTheme } from '../../../providers/LumoThemeProvider';
import { getInitials } from '../../../util/username';
import CreateFreeAccountLink from '../CreateFreeAccountLink/CreateFreeAccountLink';
import { LumoLogoThemeAware } from '../LumoLogoThemeAware';
import LumoThemeButton from '../LumoThemeButton';
import { SignInLinkButton } from '../SignInLink';
import DeleteAllButton from './DeleteAllButton';
import LumoSettingsUpgradePanel from './LumoSettingsUpgradePanel';

import './SettingsModal.scss';

const SettingsSectionItem = ({
    icon,
    text,
    subtext,
    button,
    useEllipsisOnContent,
}: {
    icon: IconName;
    text: string | React.ReactNode;
    subtext?: string | React.ReactNode;
    button?: React.ReactNode;
    useEllipsisOnContent?: boolean;
}) => {
    const subTextContent =
        typeof subtext === 'string' ? (
            <span
                className={clsx('color-weak', useEllipsisOnContent && 'text-ellipsis')}
                title={useEllipsisOnContent ? subtext : undefined}
            >
                {subtext}
            </span>
        ) : (
            subtext
        );

    return (
        <div className="flex flex-row flex-nowrap gap-4 items-start p-2">
            <Avatar color="weak" className="settings-section-icon">
                <Icon className="shrink-0 color-weak" name={icon} size={5} />
            </Avatar>
            <div className="flex-1 flex flex-column *:min-size-auto sm:flex-row flex-nowrap gap-2">
                <div className="flex flex-column flex-nowrap flex-1 min-w-0">
                    {typeof text === 'string' ? (
                        <span
                            className={clsx('text-semibold', useEllipsisOnContent && 'text-ellipsis')}
                            title={useEllipsisOnContent ? text : undefined}
                        >
                            {text}
                        </span>
                    ) : (
                        text
                    )}
                    {subtext ? subTextContent : null}
                </div>
                <div className="shrink-0 my-auto">{button}</div>
            </div>
        </div>
    );
};

interface SettingsItem {
    id: string;
    icon: IconName;
    getText: () => string;
    guest: boolean;
}

const SettingsItems: SettingsItem[] = [
    {
        id: 'account',
        icon: 'user',
        getText: () => c('collider_2025: Settings Item').t`Account`,
        guest: true,
    },
    { id: 'general', icon: 'cog-wheel', getText: () => c('collider_2025: Settings Item').t`General`, guest: true },
];
const LumoSettingsSidebar = ({
    activePanel,
    onPanelChange,
    isGuest,
}: {
    activePanel: string;
    onPanelChange: (panel: string) => void;
    isGuest: boolean;
}) => {
    return (
        <div
            className="flex flex-column gap-6 md:max-w-custom md:w-custom"
            style={{ '--md-max-w-custom': '14rem', '--md-w-custom': '10rem' }}
        >
            {/* Lumo Logo */}
            <div className="hidden md:flex gap-2">
                <img src={lumoAvatarNeutral} alt="Lumo" height="50px" />
                <LumoLogoThemeAware height="32px" />
            </div>

            {/* Navigation Items */}
            <ul className="unstyled m-0 flex flex-row md:flex-column flex-nowrap gap-2 md:gap-4 mb-4">
                {SettingsItems.map((item) => (
                    <li key={item.id}>
                        <Button
                            shape="ghost"
                            className={clsx(
                                'flex flex-row gap-2 items-center flex-nowrap',
                                activePanel === item.id && 'is-active'
                            )}
                            onClick={() => onPanelChange(item.id)}
                            fullWidth
                            disabled={isGuest && !item.guest}
                            aria-pressed={activePanel === item.id}
                        >
                            <Icon className="shrink-0" name={item.icon} />
                            <span className="text-ellipsis">{item.getText()}</span>
                        </Button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

const GeneralSettingsPanel = ({ isGuest, onClose }: { isGuest: boolean; onClose?: () => void }) => {
    const { DATE_VERSION } = useConfig();
    const { isDarkLumoTheme } = useLumoTheme();
    const isLumoDarkModeEnabled = useFlag('LumoDarkMode');
    return (
        <div>
            {isLumoDarkModeEnabled && (
                <SettingsSectionItem
                    icon={isDarkLumoTheme ? 'moon' : 'sun'}
                    text={c('collider_2025: Title').t`Theme`}
                    subtext={c('collider_2025: Description').t`Switch between light and dark mode`}
                    button={<LumoThemeButton />}
                />
            )}
            {!isGuest && (
                <SettingsSectionItem
                    icon="speech-bubble"
                    text={c('collider_2025: Title').t`Delete all chats`}
                    subtext={c('collider_2025: Description').t`Permanently delete your chats. This is irreversible.`}
                    button={<DeleteAllButton onClose={onClose} />}
                />
            )}
            <SettingsSectionItem
                icon="info-circle"
                text={c('collider_2025: Title').t`About ${LUMO_SHORT_APP_NAME}`}
                subtext={c('collider_2025: Description').jt`Last updated on ${DATE_VERSION}`}
            />
        </div>
    );
};

const AccountSettingsPanel = () => {
    const [user] = useUser();
    const { hasLumoSeat, isVisionary, hasLumoPlusAddon } = useLumoPlan();

    return (
        <>
            <div className="flex flex-column flex-nowrap gap-4">
                <ButtonLike
                    as={SettingsLink}
                    path={''}
                    className="user-settings-card flex flex-row flex-nowrap gap-4 items-start p-4 rounded-lg bg-norm cursor-pointer text-left w-full"
                >
                    <Avatar className="shrink-0">{getInitials(user.DisplayName ?? user.Name)}</Avatar>
                    <div className="flex-1 flex flex-column gap-0 items-start">
                        <div className="flex flex-row items-center gap-3 mb-1">
                            <span className="text-bold text-lg color-norm">{user.DisplayName ?? user.Name}</span>
                            {(hasLumoSeat || hasLumoPlusAddon || isVisionary) && (
                                <span className="inline-flex items-center py-1 px-2 text-xs rounded-full plan-name">
                                    {c('collider_2025: Title').t`${LUMO_SHORT_APP_NAME} Plus`}
                                </span>
                            )}

                            {isVisionary && (
                                <span className="inline-flex items-center py-1 px-2 text-xs rounded-full plan-name">
                                    {c('collider_2025: Title').t`Visionary`}
                                </span>
                            )}
                        </div>
                        <span className="color-weak text-sm text-left">{user.Email}</span>
                    </div>
                    <Icon name="chevron-right" className="color-weak shrink-0 mt-2" size={4} />
                </ButtonLike>
            </div>
            <LumoSettingsUpgradePanel />
        </>
    );
};

const AccountSettingsPanelGuest = () => {
    const createLink = <CreateFreeAccountLink />;
    return (
        <>
            <LumoSettingsUpgradePanel isGuest />
            <SettingsSectionItem
                icon="user"
                text={c('collider_2025: Title').t`Guest`}
                subtext={
                    // translator: createLink is a button Create a free account
                    c('collider_2025: Description')
                        .jt`Sign in to access your account and unlock more features. Don't have one? ${createLink}`
                }
                button={<SignInLinkButton color="weak" shape="outline" />}
            />
        </>
    );
};

const SettingsModal = ({ ...modalProps }: ModalOwnProps) => {
    const [activePanel, setActivePanel] = useState('account');
    const { isGuest } = useLumoCommon();
    const closeModal = modalProps.onClose;

    return (
        <ModalTwo size="xlarge" enableCloseWhenClickOutside className="lumo-settings-modal" {...modalProps}>
            <ModalTwoContent>
                {/* Close button in top-right corner */}
                <Button
                    icon
                    shape="ghost"
                    size="small"
                    onClick={closeModal}
                    title={c('Action').t`Close`}
                    className="modal-close-button"
                >
                    <Icon name="cross" size={6} />
                </Button>

                <div className="modal-main-container">
                    {/* Desktop view with sidebar */}
                    <div className="hidden md:flex md:flex-row flex-nowrap">
                        <div className="sidebar-container">
                            <LumoSettingsSidebar
                                activePanel={activePanel}
                                onPanelChange={setActivePanel}
                                isGuest={isGuest}
                            />
                        </div>

                        <div className="flex flex-column flex-nowrap flex-1 content-container">
                            {/* Top bar with panel name only */}
                            <div className="flex items-center top-bar">
                                <h2 className="text-xl text-semibold m-0">
                                    {SettingsItems.find((item) => item.id === activePanel)?.getText() || 'Settings'}
                                </h2>
                            </div>

                            {/* Panel content */}
                            <div className="flex flex-column flex-nowrap gap-2">
                                {activePanel === 'account' &&
                                    (isGuest ? <AccountSettingsPanelGuest /> : <AccountSettingsPanel />)}
                                {activePanel === 'general' && (
                                    <GeneralSettingsPanel isGuest={isGuest} onClose={closeModal} />
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Mobile view without tabs - all content vertically */}
                    <div className="md:hidden flex flex-column">
                        {/* Settings title */}
                        <div className="mobile-section-header">
                            <h1 className="text-2xl text-bold m-0">Settings</h1>
                        </div>

                        {/* Account section */}
                        <div className="mobile-settings-section">
                            <h2 className="text-lg text-semibold mb-4 flex items-center gap-3">
                                <Icon name="user" size={4} />
                                Account
                            </h2>
                            {isGuest ? <AccountSettingsPanelGuest /> : <AccountSettingsPanel />}
                        </div>

                        {/* General section */}
                        <div className="mobile-settings-section">
                            <h2 className="text-lg text-semibold mb-4 flex items-center gap-3">
                                <Icon name="cog-wheel" size={4} />
                                General
                            </h2>
                            <GeneralSettingsPanel isGuest={isGuest} onClose={closeModal} />
                        </div>
                    </div>
                </div>
            </ModalTwoContent>
        </ModalTwo>
    );
};

export default SettingsModal;
