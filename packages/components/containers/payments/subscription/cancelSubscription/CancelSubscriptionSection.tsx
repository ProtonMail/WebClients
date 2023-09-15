import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';

import { useSubscription, useUser } from '../../../../hooks';
import { SettingsParagraph, SettingsSection } from '../../../account';
import { useCancelSubscriptionFlow } from './useCancelSubscriptionFlow';

export const CancelSubscriptionSection = () => {
    const [subscription, loadingSubscription] = useSubscription();
    const [user] = useUser();

    const { cancelSubscriptionModals, cancelSubscription } = useCancelSubscriptionFlow({
        subscription,
        user,
    });

    if (!subscription) {
        return null;
    }

    return (
        <>
            {cancelSubscriptionModals}
            <SettingsSection>
                <SettingsParagraph>
                    {c('Info')
                        .t`This will cancel your current paid subscription and you will lose any loyalty benefits you have accumulated.`}
                </SettingsParagraph>
                <Button
                    onClick={cancelSubscription}
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
