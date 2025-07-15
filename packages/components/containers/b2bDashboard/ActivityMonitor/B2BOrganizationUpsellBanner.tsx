import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { Button, Href } from '@proton/atoms';
import { Audience, type Organization } from '@proton/shared/lib/interfaces';
import illustration from '@proton/styles/assets/img/illustrations/activity-monitor-illustration.svg';

import SettingsSectionWide from '../../account/SettingsSectionWide';
import { PromotionBanner } from '../../banner/PromotionBanner';
import { useSubscriptionModal } from '../../payments/subscription/SubscriptionModalProvider';
import { SUBSCRIPTION_STEPS } from '../../payments/subscription/constants';

interface Props {
    organization?: Organization;
}

const B2BOrganizationUpsellBanner = ({ organization }: Props) => {
    const [user] = useUser();
    const [openSubscriptionModal] = useSubscriptionModal();

    const getCustomizeSubscriptionOpener = (source: 'dashboard' | 'upsells') => () =>
        openSubscriptionModal({
            metrics: {
                source,
            },
            step: SUBSCRIPTION_STEPS.PLAN_SELECTION,
            defaultAudience: Audience.B2B,
            plan: organization?.PlanName
        });

    return (
        <SettingsSectionWide>
            <PromotionBanner
                rounded
                mode="banner"
                contentCentered={false}
                icon={<img src={illustration} alt="" width={40} height={40} />}
                description={
                    <div>
                        <b>{c('Info').t`Gain visibility across your organization`}</b>
                        <div>
                            {c('Info').t`Upgrade to Professional or a higher plan to unlock`}{' '}
                            <b>{c('Info').t`Activity Monitor`}</b>
                            {c('Info').t` and other security features.`}{' '}
                            <Href
                                href="https://proton.me/support/business-activity-monitor"
                                title={c('Info').t`Learn more about Activity Monitor`}
                            >{c('Link').t`Learn more`}</Href>
                        </div>
                    </div>
                }
                cta={
                    user.isAdmin &&
                    user.isSelf && (
                        <Button
                            color="norm"
                            fullWidth
                            onClick={getCustomizeSubscriptionOpener('upsells')}
                            title={c('Title').t`View organization events by upgrading to Professional`}
                        >
                            {c('Action').t`Upgrade to Professional`}
                        </Button>
                    )
                }
            />
        </SettingsSectionWide>
    );
};

export default B2BOrganizationUpsellBanner;
