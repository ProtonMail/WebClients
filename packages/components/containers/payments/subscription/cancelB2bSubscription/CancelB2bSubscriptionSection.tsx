import { c } from 'ttag';

import { Button } from '@proton/atoms';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import SettingsParagraph from '@proton/components/containers/account/SettingsParagraph';
import SettingsSection from '@proton/components/containers/account/SettingsSection';
import { useSubscription } from '@proton/components/hooks';

import CancelB2bSubscriptionModal from './CancelB2bSubscriptionModal';

const CancelB2bSubscriptionSection = () => {
    const [subscription, loadingSubscription] = useSubscription();

    const [modalProps, setModalOpen, render] = useModalState();

    if (!subscription) {
        return null;
    }

    return (
        <>
            {render && <CancelB2bSubscriptionModal {...modalProps} />}
            <SettingsSection>
                <SettingsParagraph>
                    {c('Info').t`To cancel your subscription, please reach out to us.`}
                </SettingsParagraph>
                <Button onClick={() => setModalOpen(true)} color="norm" shape="outline" disabled={loadingSubscription}>
                    {c('Action').t`Contact us`}
                </Button>
            </SettingsSection>
        </>
    );
};

export default CancelB2bSubscriptionSection;
