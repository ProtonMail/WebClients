import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import type { ButtonLikeShape } from '@proton/atoms';
import { ButtonLike, InlineLinkButton } from '@proton/atoms';
import { PromotionButton } from '@proton/components/components/button/PromotionButton';
import type { UPSELL_FEATURE } from '@proton/shared/lib/constants';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import { LUMO_UPGRADE_TRIGGER_CLASS } from '../../constants';
import useLumoPlusUpgradeWithTelemetry from '../../hooks/useLumoPlusUpgradeWithTelemetry';
import LumoPlusUpsellModal from '../upsells/LumoPlusUpsellModal';

type BaseProps = {
    feature: UPSELL_FEATURE;
    children?: React.ReactNode;
};

//Basic button requires shape in customButtonProps
type BasicButtonProps = BaseProps & {
    buttonComponent: 'basic-button';
    customButtonProps: {
        shape: ButtonLikeShape;
    } & Record<string, any>;
};

// Other buttons have optional customButtonProps
type StandardButtonProps = BaseProps & {
    buttonComponent: 'promotion-button' | 'inline-link-button' | 'settings-button';
    customButtonProps?: Record<string, any>;
};

type Props = BasicButtonProps | StandardButtonProps;

// We are only showing the upgrade button for free authenticated users without any lumo seats (isLumoPaid)

const LumoUpgradeButton = ({
    feature,
    buttonComponent = 'promotion-button',
    customButtonProps = {},
    children,
}: Props) => {
    const [user] = useUser();
    // const [subscription] = useSubscription();
    // const { APP_NAME } = useConfig();

    const { upsellRef, openModal, renderModal, modalProps } = useLumoPlusUpgradeWithTelemetry({
        feature,
        buttonType: buttonComponent,
    });

    // We want to have metrics from where the user has clicked on the upgrade button
    const displayUpgradeButton = user.isFree;
    const upgradeText = children || c('collider_2025: Link').t`Upgrade`;
    const upgradeIcon = 'upgrade';

    // // used to open the upgrade link in account settings if not using subscription modal
    // const upgradePathname = useMemo(() =>
    //     addUpsellPath(getUpgradePath({ user, subscription, app: APP_NAME }), upsellRef),
    //     [user, subscription, APP_NAME, upsellRef]
    // );

    if (!displayUpgradeButton) {
        return null;
    }

    const buttonProps = {
        onClick: openModal,
        title: c('collider_2025: Link').t`Upgrade to ${LUMO_SHORT_APP_NAME} Plus`,
        ...customButtonProps,
    };

    const renderButton = () => {
        switch (buttonComponent) {
            case 'inline-link-button':
                return (
                    <InlineLinkButton className={`${LUMO_UPGRADE_TRIGGER_CLASS}`} {...buttonProps}>
                        {upgradeText}
                    </InlineLinkButton>
                );
            // case 'settings-button':
            //     return (
            //         <PromotionButton
            //             as={SettingsLink}
            //             {...buttonProps}
            //             iconName={upgradeIcon}
            //             iconSize={4}
            //             size="medium"
            //             path={upgradePathname}
            //             responsive
            //             className={`${LUMO_UPGRADE_TRIGGER_CLASS}`}
            //         >
            //             {upgradeText}
            //         </PromotionButton>
            //     );
            case 'basic-button':
                return (
                    <ButtonLike size="medium" className={`${LUMO_UPGRADE_TRIGGER_CLASS}`} {...buttonProps}>
                        {upgradeText}
                    </ButtonLike>
                );
            case 'promotion-button':
            default:
                return (
                    <PromotionButton
                        className={`shrink-0 upsell-addon-button ${LUMO_UPGRADE_TRIGGER_CLASS}`}
                        buttonGradient={true}
                        as={ButtonLike}
                        iconName={upgradeIcon}
                        iconSize={4}
                        size="medium"
                        responsive
                        {...buttonProps}
                    >
                        {upgradeText}
                    </PromotionButton>
                );
        }
    };

    return (
        <>
            {renderButton()}
            {renderModal && <LumoPlusUpsellModal modalProps={modalProps} upsellRef={upsellRef} />}
        </>
    );
};

export default LumoUpgradeButton;
