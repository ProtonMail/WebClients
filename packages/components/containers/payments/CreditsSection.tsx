import { c } from 'ttag';

import { Button } from '@proton/atoms';

import { useModals, useUser } from '../../hooks';
import { SettingsParagraph, SettingsSection } from '../account';
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
                    .t`When your subscription renews, we will apply any available credits before we charge the payment method above.`}
            </SettingsParagraph>
            <div className="mb2">
                <Button shape="outline" onClick={handleAddCreditsClick}>{c('Action').t`Add credits`}</Button>
            </div>
            <div className="pl1 pr1 mb1 flex flex-justify-space-between">
                <span className="text-bold">{c('Credits').t`Available credits`}</span>
                <span className="text-bold">{Credit / 100}</span>
            </div>
            <hr />
        </SettingsSection>
    );
};

export default CreditsSection;
