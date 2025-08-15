import React, { useState } from 'react';

import clsx from 'clsx';
import { c } from 'ttag';

import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import { Avatar, Button, ButtonLike } from '@proton/atoms';
import type { IconName } from '@proton/components';
import { Icon, ModalTwo, ModalTwoContent, ModalTwoHeader, SettingsLink } from '@proton/components';
import type { ModalOwnProps } from '@proton/components/components/modalTwo/Modal';
import Time from '@proton/components/components/time/Time';
import useConfig from '@proton/components/hooks/useConfig';
import { getRenewalTime, getSubscriptionPlanTitle } from '@proton/payments';
import { LUMO_SHORT_APP_NAME, LUMO_UPSELL_PATHS } from '@proton/shared/lib/constants';
import { UserType } from '@proton/shared/lib/interfaces';

import { useLumoCommon } from '../../../hooks/useLumoCommon';
import { useLumoPlan } from '../../../hooks/useLumoPlan';
import LumoUpgradeButton from '../../header/LumoUpgradeButton';
import CreateFreeAccountLink from '../CreateFreeAccountLink/CreateFreeAccountLink';
import GetLumoPlusGuestButton from '../GetLumoPlusGuestButton/GetLumoPlusGuestButton';
import LumoUpsellAddonButton from '../LumoUpsellAddonButton';
import { SignInLinkButton } from '../SignInLink';
import DeleteAllButton from './DeleteAllButton';

import './SettingsModal.scss';

interface LumoCharacteristic {
    icon: IconName;
    getText: () => string;
}

const CharacteristicItem = ({ characteristic }: { characteristic: LumoCharacteristic }) => (
    <li className="flex flex-row flex-nowrap gap-2 items-start py-1">
        <Icon className="color-primary shrink-0 mt-0.5" name={characteristic.icon} />
        <span className="flex-1">{characteristic.getText()}</span>
    </li>
);

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
    return (
        <div
            className={
                'settings-modal-panel flex flex-column flex-nowrap gap-6 p-4 rounded-lg ' +
                (isGuest ? 'hidden sm:block' : '')
            }
        >
            <div className="flex flex-row sm:flex-nowrap justify-space-between gap-2">
                <div className="flex flex-column flex-nowrap gap-2">
                    <span className="text-lg text-bold">{c('collider_2025: Title')
                        .t`${LUMO_SHORT_APP_NAME} Plus`}</span>
                    <span className="color-weak">{c('collider_2025: Description').t`Boost your productivity`}</span>
                </div>
                {isGuest ? (
                    <GetLumoPlusGuestButton />
                ) : (
                    <LumoUpgradeButton feature={LUMO_UPSELL_PATHS.SETTINGS_MODAL} buttonComponent="promotion-button" />
                )}
            </div>
            <ul className="unstyled m-0 columns-1 md:columns-2">
                {lumoCharacteristics.map((characteristic) => (
                    <CharacteristicItem key={characteristic.getText()} characteristic={characteristic} />
                ))}
            </ul>
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
                className={clsx('text-weak', useEllipsisOnContent && 'text-ellipsis')}
                title={useEllipsisOnContent ? subtext : undefined}
            >
                {subtext}
            </span>
        ) : (
            subtext
        );

    return (
        <div className="flex flex-row flex-nowrap gap-4 items-start p-2">
            <Avatar color="weak" className="mt-1">
                <Icon className="shrink-0" name={icon} />
            </Avatar>
            <div className="flex-1 flex flex-column *:min-size-auto sm:flex-row flex-nowrap gap-2">
                <div className="flex flex-column flex-nowrap flex-1 min-w-0">
                    {typeof text === 'string' ? (
                        <span
                            className={clsx('text-bold', useEllipsisOnContent && 'text-ellipsis')}
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
    // {
    //     id: 'all',
    //     icon: 'arrow-out-square',
    //     getText: () => c('collider_2025: Settings Item').t`All settings`,
    //     guest: false,
    // },
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
        <ul
            className="unstyled m-0 flex flex-row md:flex-column flex-nowrap gap-2 md:gap-4 md:max-w-custom md:w-custom mb-4"
            style={{ '--md-max-w-custom': '14rem', '--md-w-custom': '10rem' }}
        >
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

const RenewalTime = ({ timestamp }: { timestamp: number }) => (
    <Time format="PPP" sameDayFormat={false}>
        {timestamp}
    </Time>
);

const getPlanSubtext = (
    isLumoPaid: boolean,
    isOrgOrMultiUser: boolean,
    includesLumoAddon: boolean,
    canShowLumoUpsellFree: boolean,
    canShowLumoUpsellB2BOrB2C: boolean,
    renewalTime?: number
) => {
    if (isOrgOrMultiUser) {
        return isLumoPaid
            ? c('collider_2025: Description').t`Talk to your admin for plan details`
            : c('collider_2025: Description').t`Talk to your admin to add ${LUMO_SHORT_APP_NAME} Plus`;
    }
    // Non-paid user
    if (canShowLumoUpsellFree) {
        return c('collider_2025: Description').t`Upgrade to ${LUMO_SHORT_APP_NAME} Plus`;
    }

    if (canShowLumoUpsellB2BOrB2C) {
        return c('collider_2025: Description').t`Add ${LUMO_SHORT_APP_NAME} Plus to unlock more benefits`;
    }

    if (includesLumoAddon) {
        return c('collider_2025: Description').t`Your plan includes ${LUMO_SHORT_APP_NAME} Plus`;
    }

    // Paid user with renewal information
    if (renewalTime) {
        const date = <RenewalTime timestamp={renewalTime} />;
        return c('collider_2025: Description').jt`Your plan renews on ${date}`;
    }

    return '';
};

const getAccountPlanButton = (
    isLumoPaid: boolean,
    isOrgOrMultiUser: boolean,
    canShowLumoUpsellFree: boolean,
    canShowLumoUpsellB2BOrB2C: boolean
) => {
    if (isOrgOrMultiUser) {
        return null;
    }

    if (isLumoPaid) {
        return (
            <ButtonLike as={SettingsLink} className="flex-shrink-0" path={''}>
                {c('collider_2025: Link').t`Manage`}
            </ButtonLike>
        );
    }

    if (canShowLumoUpsellB2BOrB2C) {
        return <LumoUpsellAddonButton type="button" />;
    }

    if (canShowLumoUpsellFree) {
        return (
            <LumoUpgradeButton
                feature={LUMO_UPSELL_PATHS.SETTINGS_MODAL_PLAN}
                buttonComponent="basic-button"
                customButtonProps={{ shape: 'outline' }}
            >
                {c('collider_2025: Button').t`Explore ${LUMO_SHORT_APP_NAME} Plus`}
            </LumoUpgradeButton>
        );
    }

    return null;
};

const AccountSettingsPanel = () => {
    const [user] = useUser();
    const [subscription, subscriptionLoading] = useSubscription();
    const {
        hasLumoSeat,
        isVisionary,
        hasLumoPlusAddon,
        canShowUpsell,
        canShowLumoUpsellB2BOrB2C,
        isOrgOrMultiUser,
        canShowLumoUpsellFree,
    } = useLumoPlan();

    // showing Manage account button for users that can see Delete account section in settings - for mobile apps
    const canShowManageAccountButton = user.Type === UserType.PROTON || user.Type === UserType.EXTERNAL;

    const planTitle = user.isMember ? '' : getSubscriptionPlanTitle(user, subscription).planTitle;
    const renewalTime = subscription ? getRenewalTime(subscription) : undefined;

    // TODO: use when handling paid user upsells in app
    // const upsellRef = getUpsellRef({
    //     app: APP_UPSELL_REF_PATH.LUMO_UPSELL_REF_PATH,
    //     component: UPSELL_COMPONENT.BUTTON,
    //     feature: LUMO_UPSELL_PATHS.SETTINGS_MODAL,
    // });

    // const { lumoUpsellConfig } = useLumoUpsellConfig({ upsellRef, plans: plans?.plans ?? [] });
    console.log('subscriptionLoading', subscriptionLoading);

    if (subscriptionLoading) {
        return null;
    }

    return (
        <>
            {canShowUpsell && <LumoSettingsUpgradePanel />}
            <div className="flex flex-column flex-nowrap gap-4">
                <SettingsSectionItem
                    icon="user"
                    useEllipsisOnContent
                    text={user.DisplayName ?? user.Name}
                    subtext={user.Email}
                    button={
                        !isOrgOrMultiUser && (
                            <ButtonLike as={SettingsLink} className="flex-shrink-0 manage-plan" path={''}>
                                {c('collider_2025: Link').t`Manage plan`}
                            </ButtonLike>
                        )
                    }
                />

                <SettingsSectionItem
                    icon="user"
                    text={
                        <span className="flex flex-row gap-2">
                            <span className="text-bold">{c('collider_2025: Title').t`Your plan`}</span>{' '}
                            {planTitle && (
                                <span className="inline-block py-px px-1 text-sm rounded-sm plan-name">
                                    {planTitle}
                                </span>
                            )}
                            {(hasLumoPlusAddon || isVisionary) && (
                                <span className="inline-block py-px px-1 text-sm rounded-sm plan-name">
                                    {c('collider_2025: Title').t`${LUMO_SHORT_APP_NAME} Plus`}
                                </span>
                            )}
                        </span>
                    }
                    subtext={getPlanSubtext(
                        hasLumoSeat,
                        isOrgOrMultiUser,
                        hasLumoPlusAddon,
                        canShowLumoUpsellFree,
                        canShowLumoUpsellB2BOrB2C,
                        renewalTime
                    )}
                    button={getAccountPlanButton(
                        hasLumoSeat,
                        isOrgOrMultiUser,
                        canShowLumoUpsellFree,
                        canShowLumoUpsellB2BOrB2C
                    )}
                />
                {canShowManageAccountButton && (
                    <SettingsSectionItem
                        icon="arrow-out-square"
                        text={c('collider_2025: Title').t`Manage account`}
                        subtext={c('collider_2025: Description')
                            .t`To delete your account and more, go to account settings.`}
                        button={
                            <ButtonLike as={SettingsLink} shape="outline" path={'/account-password#delete'}>{c(
                                'collider_2025: Button'
                            ).t`Manage account`}</ButtonLike>
                        }
                    />
                )}
            </div>
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
            <ModalTwoHeader
                title={c('collider_2025: Title').t`Settings`}
                subline={c('collider_2025: Title').t`Manage your account and preferences`}
            />
            <ModalTwoContent>
                <div className="md:flex md:flex-row flex-nowrap gap-8">
                    <LumoSettingsSidebar activePanel={activePanel} onPanelChange={setActivePanel} isGuest={isGuest} />

                    <div className="flex flex-column flex-nowrap gap-2 flex-1">
                        {activePanel === 'account' &&
                            (isGuest ? <AccountSettingsPanelGuest /> : <AccountSettingsPanel />)}
                        {activePanel === 'general' && <GeneralSettingsPanel isGuest={isGuest} onClose={closeModal} />}
                    </div>
                </div>
            </ModalTwoContent>
        </ModalTwo>
    );
};

export default SettingsModal;
