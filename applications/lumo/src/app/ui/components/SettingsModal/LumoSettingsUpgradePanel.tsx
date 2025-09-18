import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms';
import { Icon, SettingsLink, useConfig } from '@proton/components';
import { PromotionButton } from '@proton/components/components/button/PromotionButton';
import type { IconName } from '@proton/components/components/icon/Icon';
import { LUMO_SHORT_APP_NAME, LUMO_UPSELL_PATHS, UPSELL_COMPONENT } from '@proton/shared/lib/constants';
import { addUpsellPath, getUpsellRefFromApp } from '@proton/shared/lib/helpers/upsell';

import { LUMO_PLUS_FREE_PATH_TO_ACCOUNT, LUMO_UPGRADE_TRIGGER_CLASS } from '../../../constants';
import { useLumoPlan } from '../../../hooks/useLumoPlan';
import GetLumoPlusGuestButton from '../GetLumoPlusGuestButton/GetLumoPlusGuestButton';
import LumoCatPlusCollarInline from '../LumoCatPlusCollarInline';
import LumoPlusLogoInline from '../LumoPlusLogoInline';

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

interface LumoSettingsUpgradePanelProps {
    isGuest?: boolean;
}

const LumoSettingsUpgradePanel = ({ isGuest = false }: LumoSettingsUpgradePanelProps) => {
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
                'settings-modal-panel flex flex-row gap-6 p-6 rounded-lg lumo-plus-settings-gradient border border-weak flex-nowrap '
                // (isGuest ? 'hidden sm:block' : '')
            }
        >
            {/* Left side - Content */}
            <div className="flex flex-column flex-nowrap gap-4 flex-1 w-1/2">
                {/* Header */}
                <div className="flex items-center gap-2">
                    <LumoPlusLogoInline height="20px" />
                </div>

                {/* Subscription status message */}
                {hasLumoPlus && (
                    <div className="flex flex-column gap-1">
                        <p className="text-sm m-0">
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
                            <span className="text-sm">{characteristic.getText()}</span>
                        </li>
                    ))}
                </ul>

                {/* Action area - button or message */}
                <div className="mt-2 w-fit-content">{getActionContent()}</div>
            </div>

            {/* Right side - Lumo cat illustration */}
            <div className="flex items-end justify-end shrink-0 w-1/2">
                <LumoCatPlusCollarInline style={{ width: '80%', height: 'auto' }} />
            </div>
        </div>
    );
};

export default LumoSettingsUpgradePanel;
