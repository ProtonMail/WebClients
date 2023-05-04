import { c } from 'ttag';

import { Button } from '@proton/atoms';

import { useModalState } from '../..';
import { useUser } from '../../hooks';
import { SettingsParagraph, SettingsSection } from '../account';
import CreditsModal from './CreditsModal';

const CreditsSection = () => {
    const [creditModalProps, setCreditModalOpen, renderCreditModal] = useModalState();

    const [{ Credit }] = useUser();

    return (
        <SettingsSection>
            <SettingsParagraph>
                {c('Info')
                    .t`When your subscription renews, we will apply any available credits before we charge the payment method above.`}
            </SettingsParagraph>
            <div className="mb-7">
                <Button shape="outline" onClick={() => setCreditModalOpen(true)}>{c('Action').t`Add credits`}</Button>
            </div>
            <div className="px-4 mb-4 flex flex-justify-space-between">
                <span className="text-bold">{c('Credits').t`Available credits`}</span>
                <span className="text-bold">{Credit / 100}</span>
            </div>
            <hr />
            {renderCreditModal && <CreditsModal {...creditModalProps} />}
        </SettingsSection>
    );
};

export default CreditsSection;
