import { c } from 'ttag';

import { Button, Href, Icon } from '@proton/components';

interface Props {
    show: boolean;
    handleClose: () => void;
}

const InviteHowItWorks = ({ show = false, handleClose }: Props) => {
    if (!show) {
        return null;
    }

    return (
        <div className="relative border rounded-lg p2 bg-primary">
            <Button className="absolute top right" shape="ghost" onClick={handleClose}>
                <Icon name="xmark" />
            </Button>
            <h2 className="text-bold">{c('Title').t`Get up to 18 months of Mail Plus for free`}</h2>

            <ol className="flex flex-nowrap flex-gap-1 unstyled on-tablet-flex-column mb2">
                <li className="flex-item-fluid">
                    <h3 className="mb0-5 flex flex-align-items-baseline">
                        <span className="h3 mb0 mr0-5">1.</span>
                        <span>{c('Info').t`Invite friends`}</span>
                    </h3>
                    {c('Info').t`Just send them your personal referral link`}
                </li>
                <li className="flex-item-fluid">
                    <h3 className="mb0-5 flex flex-align-items-baseline">
                        <span className="h3 mb0 mr0-5">2.</span>
                        <span>{c('Info').t`They signup`}</span>
                    </h3>
                    {c('Info').t`The 30-day free trial is not available any other way`}
                </li>
                <li className="flex-item-fluid">
                    <h3 className="mb0-5 flex flex-align-items-baseline">
                        <span className="h3 mb0 mr0-5">3.</span>
                        <span>{c('Info').t`Get rewarded`}</span>
                    </h3>
                    {c('Info').t`1 to 3 months of Mail Plus will appear as credits on your next bill`}
                </li>
            </ol>
            <p className="text-small mb0">
                {c('Info').t`Refer, receive, repeat. You can earn credits for up to 18 months of Mail Plus.`}
                <Href href="https://protonmail.com/terms-and-conditions">{c('Link').t`Terms and conditions`}</Href>
            </p>
        </div>
    );
};

export default InviteHowItWorks;
