import React from 'react';
import { c } from 'ttag';

import { useModals, useUser } from '../../hooks';

import { Button } from '../../components';
import { SettingsSection, SettingsParagraph } from '../account';
import CreditsModal from './CreditsModal';

const CreditsSection = () => {
    const { createModal } = useModals();

    const handleAddCreditsClick = () => {
        createModal(<CreditsModal />);
    };

    const [{ Credit }] = useUser();

    return (
        <SettingsSection>
            <SettingsParagraph>
                {c('Info')
                    .t`When your subscription renews, any available credits will be used first before we charge your payment methods above.`}
            </SettingsParagraph>
            <div className="mb2">
                <Button shape="outline" onClick={handleAddCreditsClick}>{c('Action').t`Add credits`}</Button>
            </div>
            <div className="pl1 pr1 mb1 flex flex-justify-space-between">
                <span className="text-bold">{c('Credits').t`Unused credits`}</span>
                <span className="text-bold">{Credit / 100}</span>
            </div>
            <hr />
        </SettingsSection>
    );
};

export default CreditsSection;
