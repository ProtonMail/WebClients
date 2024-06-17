import { useFlag } from '@unleash/proxy-client-react';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { APP_NAMES, BRAND_NAME } from '@proton/shared/lib/constants';

import { SettingsParagraph, SettingsSection } from '../../../account';
import { useCancellationFlow } from '../cancellationFlow';
import { useCancelSubscriptionFlow } from './useCancelSubscriptionFlow';

export const CancelSubscriptionSection = ({ app }: { app: APP_NAMES }) => {
    const newCancellationPolicy = useFlag('ExtendCancellationProcess');
    const { redirectToCancellationFlow, b2bAccess, b2cAccess } = useCancellationFlow();
    const { loadingCancelSubscription, cancelSubscriptionModals, cancelSubscription } = useCancelSubscriptionFlow({
        app,
    });

    if (loadingCancelSubscription) {
        return null;
    }

    const handleContinueClick = () => {
        if (b2cAccess || b2bAccess) {
            redirectToCancellationFlow();
        } else {
            void cancelSubscription();
        }
    };

    const description = newCancellationPolicy
        ? c('Info')
              .t`When you cancel, your subscription won't be renewed, but you can still enjoy plan benefits until the end of the subscription period. After that, you will be downgraded to the ${BRAND_NAME} Free plan.`
        : c('Info')
              .t`This will cancel your current paid subscription and you will lose any loyalty benefits you have accumulated.`;

    const cta = newCancellationPolicy ? c('Action').t`Continue` : c('Action').t`Cancel subscription`;

    return (
        <>
            {cancelSubscriptionModals}
            <SettingsSection>
                <SettingsParagraph>{description}</SettingsParagraph>
                <Button
                    onClick={handleContinueClick}
                    data-testid="CancelSubsriptionButton"
                    shape="outline"
                    disabled={loadingCancelSubscription}
                >
                    {cta}
                </Button>
            </SettingsSection>
        </>
    );
};
