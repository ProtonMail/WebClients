import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import useLoading from '@proton/hooks/useLoading';
import { APP_NAMES } from '@proton/shared/lib/constants';
import noop from '@proton/utils/noop';

import { SettingsParagraph, SettingsSection } from '../../account';
import { useCancelSubscriptionFlow } from './cancelSubscription';

const DowngradeSubscriptionSection = ({ app }: { app: APP_NAMES }) => {
    const { cancelSubscription, cancelSubscriptionModals, loadingCancelSubscription } = useCancelSubscriptionFlow({
        app,
    });

    const [submitting, withSubmitting] = useLoading();

    return (
        <SettingsSection>
            {cancelSubscriptionModals}
            <SettingsParagraph>
                {c('Info')
                    .t`This will cancel your current paid subscription and you will lose any loyalty benefits you have accumulated. The remaining balance of your subscription will be returned as account credits.`}
            </SettingsParagraph>
            <Button
                color="danger"
                shape="outline"
                disabled={loadingCancelSubscription}
                loading={submitting}
                onClick={() => withSubmitting(cancelSubscription().catch(noop))}
                data-testid="UnsubscribeButton"
            >
                {c('Action').t`Downgrade account`}
            </Button>
        </SettingsSection>
    );
};

export default DowngradeSubscriptionSection;
