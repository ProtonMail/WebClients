import { c } from 'ttag';

import { Button, Href } from '@proton/atoms';
import Icon from '@proton/components/components/icon/Icon';
import { BRAND_NAME, PLANS, PLAN_NAMES } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

interface Props {
    handleClose: () => void;
}

const InviteHowItWorks = ({ handleClose }: Props) => {
    const planName = PLAN_NAMES[PLANS.MAIL];

    return (
        <div className="relative rounded p-7 bg-primary">
            <Button
                className="absolute top-0 right-0"
                icon
                shape="ghost"
                onClick={handleClose}
                title={c('Action').t`Close`}
            >
                <Icon name="cross" alt={c('Action').t`Close`} />
            </Button>
            <h2 className="text-bold">{c('Title').t`How to refer a friend and get credits`}</h2>

            <ol className="flex flex-nowrap gap-4 unstyled flex-column lg:flex-row mb-8">
                <li className="lg:flex-1">
                    <h3 className="mb-2 text-bold">{c('Info').t`1. Invite friends to ${BRAND_NAME}`}</h3>
                    {c('Info').t`Just send them your personal referral link.`}
                </li>
                <li className="lg:flex-1">
                    <h3 className="mb-2 text-bold">{
                        // translator: full sentense would be "They try Mail Plus"
                        c('Info').t`2. They try ${planName}`
                    }</h3>
                    {c('Info').t`They'll receive a free month of ${planName}.`}
                </li>
                <li className="lg:flex-1">
                    <h3 className="mb-2 text-bold">{c('Info').t`3. You earn credits`}</h3>
                    {c('Info').t`When they subscribe to a plan, you'll get credits to use on your subscription.`}
                </li>
            </ol>
            <p className="text-sm mb-0">
                <Href href={getKnowledgeBaseUrl('/referral-program')}>{c('Link').t`Learn more`}</Href>
            </p>
        </div>
    );
};

export default InviteHowItWorks;
