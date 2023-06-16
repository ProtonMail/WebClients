import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { useModalTwo } from '@proton/components/components';

import { useSubscription } from '../../../hooks';
import { SettingsParagraph, SettingsSection } from '../../account';
import CancelSubscriptionModal from '../CancelSubscriptionModal';

const CancelSubscriptionSection = () => {
    const [subscription, loadingSubscription] = useSubscription();

    const [cancelSubscriptionModal, showCancelSubscriptionModal] = useModalTwo(CancelSubscriptionModal);

    if (!subscription) {
        return null;
    }

    return (
        <>
            {cancelSubscriptionModal}
            <SettingsSection>
                <SettingsParagraph>
                    {c('Info')
                        .t`This will cancel your current paid subscription and you will lose any loyalty benefits you have accumulated.`}
                </SettingsParagraph>
                <Button
                    onClick={() =>
                        showCancelSubscriptionModal({
                            subscription,
                        })
                    }
                    data-testid="CancelSubsriptionButton"
                    color="danger"
                    shape="outline"
                    disabled={loadingSubscription}
                >
                    {c('Action').t`Cancel subscription`}
                </Button>
            </SettingsSection>
        </>
    );
};

export default CancelSubscriptionSection;
