import React, { useState } from 'react';

import clsx from 'clsx';
import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { Avatar, Button, ButtonLike } from '@proton/atoms';
import type { IconName, ModalOwnProps } from '@proton/components';
import { Icon, ModalTwo, ModalTwoContent, SettingsLink, useConfig } from '@proton/components';
import { PromotionButton } from '@proton/components/components/button/PromotionButton';
import { LUMO_SHORT_APP_NAME, LUMO_UPSELL_PATHS, UPSELL_COMPONENT } from '@proton/shared/lib/constants';
import { addUpsellPath, getUpsellRefFromApp } from '@proton/shared/lib/helpers/upsell';
import lumoCatPlusCollar from '@proton/styles/assets/img/lumo/lumo-cat-plus-collar.svg';
import lumoLogoFull from '@proton/styles/assets/img/lumo/lumo-logo-full.svg';
import lumoPlusLogo from '@proton/styles/assets/img/lumo/lumo-plus-logo.svg';

import { LUMO_PLUS_FREE_PATH_TO_ACCOUNT, LUMO_UPGRADE_TRIGGER_CLASS } from '../../../constants';
import { useLumoCommon } from '../../../hooks/useLumoCommon';
import { useLumoPlan } from '../../../hooks/useLumoPlan';
import { getInitials } from '../../../util/username';
import CreateFreeAccountLink from '../CreateFreeAccountLink/CreateFreeAccountLink';
import GetLumoPlusGuestButton from '../GetLumoPlusGuestButton/GetLumoPlusGuestButton';
import { SignInLinkButton } from '../SignInLink';
import DeleteAllButton from './DeleteAllButton';

import './SettingsModal.scss';

interface LumoCharacteristic {
    icon: IconName;
    getText: () => string;
}

const lumoCharacteristics: LumoCharacteristic[] = [
    {
        icon: 'speech-bubble',
        getText: () => c('collider_2025: Characteristic').t`Unlimited daily chats`,
    },
    {
        icon: 'arrow-up-line',
        getText: () => c('collider_2025: Characteristic').t`Multiple large uploads`,
    },
    {
        icon: 'clock-rotate-left',
        getText: () => c('collider_2025: Characteristic').t`Extended chat history`,
    },
    {
        icon: 'tag',
        getText: () => c('collider_2025: Characteristic').t`Priority access`,
    },
];

const LumoSettingsUpgradePanel = ({ isGuest = false }: { isGuest?: boolean }) => {
    const {
        isOrgOrMultiUser,
        hasLumoSeat,
        hasLumoPlusAddon,
        isVisionary,
        canShowLumoUpsellB2BOrB2C,
        canShowLumoUpsellFree,
    } = useLumoPlan();
    const { APP_NAME } = useConfig();

    // Create the same upgrade URL as used in LumoPlusUpsellModal
    const lumoPlusModalUpsellRef = getUpsellRefFromApp({
        app: APP_NAME,
        feature: LUMO_UPSELL_PATHS.SETTINGS_MODAL,
        component: UPSELL_COMPONENT.BUTTON,
        fromApp: APP_NAME,
    });
    const upgradeUrl = addUpsellPath(LUMO_PLUS_FREE_PATH_TO_ACCOUNT, lumoPlusModalUpsellRef);

    // Check if user has Lumo Plus
    const hasLumoPlus = hasLumoSeat || hasLumoPlusAddon || isVisionary;

    // If user can't see upsells and doesn't have Plus, don't show anything
    if (!hasLumoPlus && !canShowLumoUpsellFree && !canShowLumoUpsellB2BOrB2C && !isGuest) {
        return null;
    }

    // Determine what to show in the action area
    const getActionContent = () => {
        // If user has Lumo Plus, show manage button
        if (hasLumoPlus) {
            return (
                <ButtonLike
                    as={SettingsLink}
                    path={''}
                    shape="outline"
                    color="weak"
                    size="medium"
                    className="shrink-0 manage-plan"
                >
                    {c('Action').t`Manage`}
                </ButtonLike>
            );
        }

        // For non-Plus users
        if (isGuest) {
            return <GetLumoPlusGuestButton />;
        }

        if (isOrgOrMultiUser && !canShowLumoUpsellB2BOrB2C) {
            return (
                <div className="text-center p-3 rounded-md bg-weak">
                    <span className="text-sm color-weak">
                        {c('collider_2025: Info').t`Talk to your admin to add ${LUMO_SHORT_APP_NAME} Plus`}
                    </span>
                </div>
            );
        }

        if (!canShowLumoUpsellFree && !canShowLumoUpsellB2BOrB2C) {
            return (
                <div className="text-center p-3 rounded-md bg-weak">
                    <span className="text-sm color-weak">
                        {c('collider_2025: Info').t`Talk to your admin for plan details`}
                    </span>
                </div>
            );
        }

        return (
            <PromotionButton
                as={SettingsLink}
                path={upgradeUrl}
                buttonGradient={true}
                size="medium"
                shape="outline"
                color="norm"
                className={`shrink-0 upsell-addon-button button-promotion ${LUMO_UPGRADE_TRIGGER_CLASS}`}
            >
                {c('collider_2025: Action').t`Upgrade`}
            </PromotionButton>
        );
    };

    return (
        <div
            className={
                'settings-modal-panel flex flex-row gap-6 p-6 rounded-lg lumo-plus-settings-gradient ' +
                (isGuest ? 'hidden sm:block' : '')
            }
        >
            {/* Left side - Content */}
            <div className="flex flex-column flex-nowrap gap-4 flex-1">
                {/* Header */}
                <div className="flex items-center gap-2">
                    <img src={lumoPlusLogo} alt="lumo+" style={{ height: '20px' }} />
                    {hasLumoPlus && isVisionary && (
                        <span className="inline-flex items-center py-1 px-2 text-xs rounded-full plan-name">
                            Visionary
                        </span>
                    )}
                </div>

                {/* Subscription status message */}
                {hasLumoPlus && (
                    <div className="flex flex-column gap-1">
                        <p className="text-sm color-norm m-0">
                            {isVisionary
                                ? c('collider_2025: Status')
                                      .t`${LUMO_SHORT_APP_NAME}+ is included in your Visionary plan and you have access to these features:`
                                : c('collider_2025: Status')
                                      .t`You are subscribed to ${LUMO_SHORT_APP_NAME}+ and have access to these features:`}
                        </p>
                    </div>
                )}

                {/* Features list */}
                <ul className="unstyled m-0 flex flex-column gap-2">
                    {lumoCharacteristics.map((characteristic) => (
                        <li key={characteristic.getText()} className="flex items-center gap-3">
                            <Icon className="color-primary shrink-0" name="checkmark" size={3} />
                            <span className="text-sm color-norm">{characteristic.getText()}</span>
                        </li>
                    ))}
                </ul>

                {/* Action area - button or message */}
                <div className="mt-2">{getActionContent()}</div>
            </div>

            {/* Right side - Lumo cat illustration */}
            <div className="flex items-end justify-end shrink-0" style={{ width: '60%' }}>
                <img src={lumoCatPlusCollar} alt="Lumo Plus Cat" style={{ width: '69%', height: 'auto' }} />
            </div>
        </div>
    );
};

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
                <Icon className="shrink-0" name={icon} size={5} />
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
            <div className="hidden md:block">
                <img src={lumoLogoFull} alt="Lumo" height="50px" />
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
    // const date = <Time format="PPP">{new Date(DATE_VERSION).getTime()}</Time>;
    return (
        <div>
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
