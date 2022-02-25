import { c } from 'ttag';

import { Button, Href, Icon } from '@proton/components';
import { getAppName } from '@proton/shared/lib/apps/helper';
import { APPS, PLANS, PLAN_NAMES } from '@proton/shared/lib/constants';

interface Props {
    show: boolean;
    handleClose: () => void;
}

const InviteHowItWorks = ({ show = false, handleClose }: Props) => {
    const appName = getAppName(APPS.PROTONMAIL);
    const planName = PLAN_NAMES[PLANS.PLUS];

    if (!show) {
        return null;
    }

    return (
        <div className="relative border rounded-lg p2 bg-primary">
            <Button className="absolute top right" shape="ghost" onClick={handleClose}>
                <Icon name="xmark" />
            </Button>
            <h2 className="text-bold">{
                // translator: full sentense would be "Get up to 18 months of Mail Plus for free"
                c('Title').t`Get up to 18 months of ${appName} ${planName} for free`
            }</h2>

            <ol className="flex flex-nowrap flex-gap-1 unstyled on-tablet-flex-column mb2">
                <li className="flex-item-fluid">
                    <h3 className="mb0-5 text-bold">{c('Info').t`1. Invite friends to Proton`}</h3>
                    {c('Info').t`Just send them your personal referral link.`}
                </li>
                <li className="flex-item-fluid">
                    <h3 className="mb0-5 text-bold">{
                        // translator: full sentense would be "They try Mail Plus"
                        c('Info').t`2. They try ${appName} ${planName}`
                    }</h3>
                    {c('Info').t`This 30-day free trial is not available any other way.`}
                </li>
                <li className="flex-item-fluid">
                    <h3 className="mb0-5 text-bold">{c('Info').t`3. You earn credits`}</h3>
                    {
                        // translator: full sentense would be "When they subscribe to a paid plan, 1 to 3 months of Mail Plus will be credited to your account."
                        c('Info')
                            .t`When they subscribe to a paid plan, 1 to 3 months of ${appName} ${planName} will be credited to your account.`
                    }
                </li>
            </ol>
            <p className="text-small mb0">
                <Href href="https://protonmail.com/support/knowledge-base/referral-program">{c('Link')
                    .t`Terms and conditions`}</Href>
            </p>
        </div>
    );
};

export default InviteHowItWorks;
