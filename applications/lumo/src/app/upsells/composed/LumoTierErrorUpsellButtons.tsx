import { c } from 'ttag';

import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import { SettingsLink } from '@proton/components';
import { PromotionButton } from '@proton/components/components/button/PromotionButton';
import { LUMO_UPSELL_PATHS } from '@proton/shared/lib/constants';

import { useAuthActionProps } from '../../hooks/useAuthActionProps';
import { useIsGuest } from '../../providers/IsGuestProvider';
import { useLumoPlan } from '../../providers/LumoPlanProvider';
import BasicUpgradeButton from '../primitives/BasicUpgradeButton';
import useLumoPlusUpsellButtonConfig from '../useLumoPlusUpsellButtonConfig';

const GuestUpsellButtons = () => {
    const signUp = useAuthActionProps('signup');
    const signIn = useAuthActionProps('signin');

    return (
        <div className="flex flex-column gap-2 shrink-0">
            <PromotionButton
                as={SettingsLink}
                path={signUp.path}
                onClick={signUp.onClick}
                shape="solid"
                color="norm"
                buttonGradient={false}
                className="text-center justify-center"
            >
                {signUp.text}
            </PromotionButton>
            <PromotionButton
                buttonGradient={false}
                as={SettingsLink}
                path={signIn.path}
                onClick={signIn.onClick}
                shape="ghost"
                className="upsell-card-button justify-center"
            >
                {signIn.text}
            </PromotionButton>
        </div>
    );
};

GuestUpsellButtons.displayName = 'GuestUpsellButtons';

const LumoTierErrorUpsellButtons = () => {
    // TODO: update to generic question limi feature
    const config = useLumoPlusUpsellButtonConfig(LUMO_UPSELL_PATHS.QUESTION_LIMIT_FREE);
    const isGuest = useIsGuest();
    const { canShowTalkToAdminLumoUpsell } = useLumoPlan();

    if (isGuest) {
        return <GuestUpsellButtons />;
    }

    if (canShowTalkToAdminLumoUpsell) {
        return (
            <Tooltip title={c('collider_2025: Tooltip').t`Contact your admin to upgrade`}>
                <div className="inline-block">
                    <BasicUpgradeButton disabled />
                </div>
            </Tooltip>
        );
    }

    if (!config) return null;

    return <BasicUpgradeButton path={config.path} onClick={config.onUpgrade} className={config?.className} />;
};

LumoTierErrorUpsellButtons.displayName = 'LumoTierErrorUpsellButtons';

export default LumoTierErrorUpsellButtons;
