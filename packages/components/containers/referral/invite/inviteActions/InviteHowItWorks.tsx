import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Href, Icon } from '@proton/components';
import { BRAND_NAME, PLANS, PLAN_NAMES } from '@proton/shared/lib/constants';
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
            <h2 className="text-bold">{c('Title').t`How to refer a friend and get credits`}</h2>

            <ol className="flex flex-nowrap flex-gap-1 unstyled on-tablet-flex-column mb2">
                <li className="flex-item-fluid">
                    <h3 className="mb0-5 text-bold">{c('Info').t`1. Invite friends to ${BRAND_NAME}`}</h3>
                    {c('Info').t`Just send them your personal referral link.`}
                </li>
                <li className="flex-item-fluid">
                    <h3 className="mb0-5 text-bold">{
                        // translator: full sentense would be "They try Mail Plus"
                        c('Info').t`2. They try ${planName}`
                    }</h3>
                    {c('Info').t`They'll receive a free month of ${planName}.`}
                </li>
                <li className="flex-item-fluid">
                    <h3 className="mb0-5 text-bold">{c('Info').t`3. You earn credits`}</h3>
                    {c('Info').t`When they subscribe to a plan, you'll get credits to use on your subscription.`}
                </li>
            </ol>
            <p className="text-small mb0">
                <Href href={getKnowledgeBaseUrl('/referral-program')}>{c('Link').t`Terms and conditions`}</Href>
            </p>
        </div>
    );
};

export default InviteHowItWorks;
