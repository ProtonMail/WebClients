import React from 'react';
import { c } from 'ttag';

import { Address } from 'proton-shared/lib/interfaces';
import { ADDRESS_TYPE } from 'proton-shared/lib/constants';

import { SettingsSection, SettingsParagraph } from '../account';
import PmMeButton from './PmMeButton';

interface Props {
    addresses: Address[];
}

const PmMeSection = ({ addresses }: Props) => {
    const hasPremium = addresses.some(({ Type }) => Type === ADDRESS_TYPE.TYPE_PREMIUM);

    return !hasPremium ? (
        <SettingsSection>
            <SettingsParagraph
                className="mb1"
                learnMoreUrl="https://protonmail.com/support/knowledge-base/pm-me-addresses/"
            >
                {c('Info')
                    .t`Add a @pm.me email address to your account. This simple, shorter domain stands for "ProtonMail me" or "Private Message me."`}
            </SettingsParagraph>
            <PmMeButton />
        </SettingsSection>
    ) : null;
};

export default PmMeSection;
