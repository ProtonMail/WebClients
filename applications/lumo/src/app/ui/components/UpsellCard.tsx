import { useMemo } from 'react';

import { c } from 'ttag';

import { Tooltip } from '@proton/atoms';
import { SettingsLink } from '@proton/components';
import { PromotionButton } from '@proton/components/components/button/PromotionButton';
import { LUMO_UPSELL_PATHS } from '@proton/shared/lib/constants';
import lumoSad from '@proton/styles/assets/img/lumo/lumo-cat-sad.svg';

import { useLumoCommon } from '../../hooks/useLumoCommon';
import { useLumoPlan } from '../../hooks/useLumoPlan';
import type { TierError } from '../../redux/slices/meta/errors';
import LumoUpgradeButton from '../header/LumoUpgradeButton';
import ChatContainerItem from './ChatContainerItem';
import LumoUpsellAddonButton from './LumoUpsellAddonButton';

import './UpsellCard.scss';

const UpsellCardWrapper = ({ children, error }: { children: React.ReactNode; error: TierError }) => {
    return (
        <ChatContainerItem className="upsell-card flex flex-nowrap flex-column lg:flex-row gap-4 lg:gap-2 p-3 rounded-xl mb-4">
            <div className="flex flex-col lg:flex-row items-center mr-1 shrink-0">
                <img
                    className="w-custom h-custom mx-auto"
                    src={lumoSad}
                    alt=""
                    style={{ '--w-custom': '3.125rem', '--h-custom': '3.125rem' }}
                />
            </div>
            <div className="flex flex-column flex-nowrap gap-2 lg:flex-1">
                <p className="error-card-title text-bold m-0">{error.errorTitle}</p>
                <p className="error-card-message m-0">{error.errorMessage}</p>
            </div>
            <div className="flex flex-column flex-nowrap gap-2 my-auto">{children}</div>
        </ChatContainerItem>
    );
};

UpsellCardWrapper.displayName = 'UpsellCardWrapper';

const AuthenticatedUpsellCard = ({ error }: { error: TierError }) => {
    const { canShowLumoUpsellB2BOrB2C, canShowLumoUpsellFree, isOrgOrMultiUser } = useLumoPlan();

    const callToAction = useMemo(() => {
        if (canShowLumoUpsellFree) {
            return (
                <LumoUpgradeButton
                    feature={LUMO_UPSELL_PATHS.QUESTION_LIMIT_FREE}
                    buttonComponent="basic-button"
                    customButtonProps={{ shape: 'solid', color: 'norm' }}
                />
            );
        }
        if (canShowLumoUpsellB2BOrB2C) {
            return <LumoUpsellAddonButton type="button" customButtonProps={{ shape: 'solid', color: 'norm' }} />;
        }
        if (isOrgOrMultiUser) {
            return (
                <Tooltip title={c('collider_2025: Tooltip').t`contact your admin to upgrade`}>
                    <div>
                        <LumoUpsellAddonButton
                            type="button"
                            customButtonProps={{ shape: 'solid', color: 'norm', disabled: true }}
                        />
                    </div>
                </Tooltip>
            );
        }
        return null;
    }, [canShowLumoUpsellB2BOrB2C, canShowLumoUpsellFree, isOrgOrMultiUser]);

    return <UpsellCardWrapper error={error}>{callToAction}</UpsellCardWrapper>;
};

AuthenticatedUpsellCard.displayName = 'AuthenticatedUpsellCard';

const UnauthenticatedUpsellCard = ({ error }: { error: TierError }) => (
    <UpsellCardWrapper error={error}>
        <div className="flex flex-column gap-2 shrink-0">
            <PromotionButton
                as={SettingsLink}
                path="/signup"
                shape="solid"
                color="norm"
                buttonGradient={false}
                className="text-center justify-center"
            >
                {c('collider_2025: Link').t`Create a free account`}
            </PromotionButton>
            <PromotionButton
                buttonGradient={false}
                as={SettingsLink}
                path=""
                shape="ghost"
                className="upsell-card-button justify-center"
            >
                {c('collider_2025: Link').t`Sign in`}
            </PromotionButton>
        </div>
    </UpsellCardWrapper>
);

UnauthenticatedUpsellCard.displayName = 'UnauthenticatedUpsellCard';

const UpsellCard = ({ error }: { error: TierError }) => {
    const { isGuest } = useLumoCommon();

    return isGuest ? <UnauthenticatedUpsellCard error={error} /> : <AuthenticatedUpsellCard error={error} />;
};

UpsellCard.displayName = 'UpsellCard';

export default UpsellCard;
