import React from 'react';

import { c } from 'ttag';

import { SettingsLink } from '@proton/components/index';
import { PromotionButton } from '@proton/components/components/button/PromotionButton';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import { LUMO_UPGRADE_TRIGGER_CLASS } from '../../../constants';

const GetLumoPlusGuestButton = () => {
    return (
        <PromotionButton
            as={SettingsLink}
            path="/signup"
            shape="outline"
            buttonGradient={true}
            className={LUMO_UPGRADE_TRIGGER_CLASS}
        >{c('collider_2025: Link').t`Get ${LUMO_SHORT_APP_NAME} Plus`}</PromotionButton>
    );
};

export default GetLumoPlusGuestButton;
