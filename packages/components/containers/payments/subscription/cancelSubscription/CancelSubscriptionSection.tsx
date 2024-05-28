import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { APP_NAMES, BRAND_NAME } from '@proton/shared/lib/constants';

import { SettingsParagraph, SettingsSection } from '../../../account';
import { useB2CCancellationFlow } from '../b2cCancellationFlow';
import { useCancelSubscriptionFlow } from './useCancelSubscriptionFlow';

export const CancelSubscriptionSection = ({ app }: { app: APP_NAMES }) => {
    const { redirectToCancellationFlow, hasAccess: hasAccessToNewCancellationFlow } = useB2CCancellationFlow();
    const { loadingCancelSubscription, cancelSubscriptionModals, cancelSubscription } = useCancelSubscriptionFlow({
        app,
    });

    if (loadingCancelSubscription) {
        return null;
    }

    const handleContinueClick = () => {
        if (hasAccessToNewCancellationFlow) {
            redirectToCancellationFlow();
        } else {
            cancelSubscription();
        }
    };

    return (
        <>
            {cancelSubscriptionModals}
            <SettingsSection>
                <SettingsParagraph>
                    {c('Info')
                        .t`When you cancel, your subscription won't be renewed, but you can still enjoy plan benefits until the end of the subscription period. After that, you will be downgraded to the ${BRAND_NAME} Free plan.`}
                </SettingsParagraph>
                <Button
                    onClick={handleContinueClick}
                    data-testid="CancelSubsriptionButton"
                    shape="outline"
                    disabled={loadingCancelSubscription}
                >
                    {c('Action').t`Continue`}
                </Button>
            </SettingsSection>
        </>
    );
};
