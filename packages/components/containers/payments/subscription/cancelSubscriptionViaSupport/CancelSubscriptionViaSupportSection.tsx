import { c } from 'ttag';

import { useSubscription } from '@proton/account/subscription/hooks';
import { Button } from '@proton/atoms';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import SettingsParagraph from '@proton/components/containers/account/SettingsParagraph';
import SettingsSection from '@proton/components/containers/account/SettingsSection';

import CancelSubscriptionViaSupportModal from './CancelSubscriptionViaSupportModal';

const CancelSubscriptionViaSupportSection = () => {
    const [subscription, loadingSubscription] = useSubscription();

    const [modalProps, setModalOpen, render] = useModalState();

    if (!subscription) {
        return null;
    }

    return (
        <>
            {render && <CancelSubscriptionViaSupportModal {...modalProps} />}
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

export default CancelSubscriptionViaSupportSection;
