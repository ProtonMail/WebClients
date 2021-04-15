import React from 'react';
import { c } from 'ttag';

import { getAccountSettingsApp } from 'proton-shared/lib/apps/helper';

import { AppLink, ButtonLike } from '../../components';

import { SettingsSection, SettingsParagraph } from '../account';
import PmMeButton from './PmMeButton';

interface Props {
    isPMAddressActive: boolean;
}

const PmMeSection = ({ isPMAddressActive }: Props) => {
    return (
        <SettingsSection>
            {!isPMAddressActive ? (
                <>
                    <SettingsParagraph
                        className="mb1"
                        learnMoreUrl="https://protonmail.com/support/knowledge-base/pm-me-addresses/"
                    >
                        {c('Info')
                            .t`Add a @pm.me email address to your account. This simple, shorter domain stands for "ProtonMail me" or "Private Message me."`}
                    </SettingsParagraph>
                    <PmMeButton />
                </>
            ) : (
                <>
                    <SettingsParagraph className="mb1">
                        {c('Info')
                            .t`You can now receive messages from your @pm.me address. Upgrade to a paid plan to also send emails using your @pm.me address and create additional @pm.me addresses.`}
                    </SettingsParagraph>

                    <ButtonLike color="norm" as={AppLink} to="/subscription" toApp={getAccountSettingsApp()}>
                        {c('Action').t`Upgrade`}
                    </ButtonLike>
                </>
            )}
        </SettingsSection>
    );
};

export default PmMeSection;
