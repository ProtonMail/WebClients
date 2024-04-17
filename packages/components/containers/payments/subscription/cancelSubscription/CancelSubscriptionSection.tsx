import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { APP_NAMES } from '@proton/shared/lib/constants';

import { SettingsParagraph, SettingsSection } from '../../../account';
import { useCancelSubscriptionFlow } from './useCancelSubscriptionFlow';

export const CancelSubscriptionSection = ({ app }: { app: APP_NAMES }) => {
    const { loadingCancelSubscription, cancelSubscriptionModals, cancelSubscription } = useCancelSubscriptionFlow({
        app,
    });

    if (loadingCancelSubscription) {
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
                    onClick={() => cancelSubscription()}
                    data-testid="CancelSubsriptionButton"
                    color="danger"
                    shape="outline"
                    disabled={loadingCancelSubscription}
                >
                    {c('Action').t`Cancel subscription`}
                </Button>
            </SettingsSection>
        </>
    );
};
