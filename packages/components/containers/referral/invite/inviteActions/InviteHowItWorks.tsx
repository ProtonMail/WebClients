import { c } from 'ttag';

import { Button, Href, Icon } from '@proton/components';
import { PLANS, PLAN_NAMES } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

interface Props {
    handleClose: () => void;
}

const InviteHowItWorks = ({ handleClose }: Props) => {
    const planName = PLAN_NAMES[PLANS.MAIL];

    return (
        <div className="relative rounded p2 bg-primary">
            <Button
                className="absolute top right"
                icon
                shape="ghost"
                onClick={handleClose}
                title={c('Action').t`Close`}
            >
                <Icon name="cross" alt={c('Action').t`Close`} />
            </Button>
            <h2 className="text-bold">{
                // translator: full sentense would be "Get up to 18 months of Mail Plus for free"
                c('Title').t`Get up to 18 months of ${planName} for free`
            }</h2>

            <ol className="flex flex-nowrap flex-gap-1 unstyled on-tablet-flex-column mb2">
                <li className="flex-item-fluid">
                    <h3 className="mb0-5 text-bold">{c('Info').t`1. Invite friends to Proton`}</h3>
                    {c('Info').t`Just send them your personal referral link.`}
                </li>
                <li className="flex-item-fluid">
                    <h3 className="mb0-5 text-bold">{
                        // translator: full sentense would be "They try Mail Plus"
                        c('Info').t`2. They try ${planName}`
                    }</h3>
                    {c('Info').t`This 30-day free trial is not available any other way.`}
                </li>
                <li className="flex-item-fluid">
                    <h3 className="mb0-5 text-bold">{c('Info').t`3. You earn credits`}</h3>
                    {
                        // translator: full sentense would be "When they subscribe to a paid plan, 1 to 3 months of Mail Plus will be credited to your account."
                        c('Info')
                            .t`When they subscribe to a paid plan, 1 to 3 months of ${planName} will be credited to your account.`
                    }
                </li>
            </ol>
            <p className="text-small mb0">
                <Href href={getKnowledgeBaseUrl('/referral-program')}>{c('Link').t`Terms and conditions`}</Href>
            </p>
        </div>
    );
};

export default InviteHowItWorks;
