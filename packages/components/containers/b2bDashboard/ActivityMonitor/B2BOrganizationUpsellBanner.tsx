import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { Button } from '@proton/atoms/Button/Button';
import { Href } from '@proton/atoms/Href/Href';
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
            plan: organization?.PlanName,
        });
    const monitorLink = (
        <Href
            href="https://proton.me/support/business-activity-monitor"
            title={c('Info').t`Activity Monitor`}
            // key is required for ttag translation interpolation
            key="monitor-link"
        >{
            /* translator: the full sentence is "Upgrade to unlock the activity monitor", where "activity monitor" is a link text, so it should be in lower case */
            c('Link').t`activity monitor`
        }</Href>
    );

    return (
        <SettingsSectionWide>
            <PromotionBanner
                rounded
                mode="banner"
                contentCentered={false}
                icon={<img src={illustration} alt="" width={40} height={40} />}
                description={
                    <div>
                        <b>{c('Info').t`Get visibility into account access`}</b>
                        <div>
                            {c('Info')
                                .t`Monitor login activity, detect unauthorized access and close security and compliance gaps. `}
                            <br />
                            {
                                /* translator: full sentence is "Upgrade to unlock the activity monitor" */
                                c('Info').jt`Upgrade to unlock the ${monitorLink}.`
                            }
                        </div>
                    </div>
                }
                cta={
                    user.isAdmin && (
                        <Button
                            color="norm"
                            fullWidth
                            onClick={getCustomizeSubscriptionOpener('upsells')}
                            title={c('Title').t`View organization events by upgrading to Professional`}
                        >
                            {c('Action').t`Upgrade`}
                        </Button>
                    )
                }
            />
        </SettingsSectionWide>
    );
};

export default B2BOrganizationUpsellBanner;
