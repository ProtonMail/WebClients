import React from 'react';

import { c } from 'ttag';

import { SettingsLink } from '@proton/components';
import { PromotionButton } from '@proton/components/components/button/PromotionButton';

import { HeaderWrapper } from './HeaderWrapper';

// TODO: Add icon for either button for mobile view

export const PublicHeader = () => {
    return (
        <HeaderWrapper>
            <PromotionButton
                as={SettingsLink}
                path="/signup"
                shape="solid"
                color="warning"
                // icon=""
                buttonGradient={false}
            >{c('collider_2025: Link').t`Create a free account`}</PromotionButton>
            <PromotionButton buttonGradient={false} as={SettingsLink} path="" shape="outline" color="weak">{c(
                'collider_2025: Link'
            ).t`Sign in`}</PromotionButton>
        </HeaderWrapper>
    );
};
