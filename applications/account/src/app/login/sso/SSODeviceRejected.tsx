import { c } from 'ttag';

import { Button } from '@proton/atoms';

import userExclamation from '../../public/user-exclamation.svg';

const SSODeviceRejected = ({ onBack }: { onBack: () => void }) => {
    return (
        <div className="flex flex-column items-center">
            <div className="mb-6">
                <img src={userExclamation} alt="" />
            </div>
            <div className="h2 text-bold mb-2">{c('sso').t`Access denied`}</div>
            <div className="text-center color-weak mb-8">
                {c('sso').t`Contact your administrator if the problem persists.`}
            </div>
            <Button size="large" shape="outline" color="weak" type="button" onClick={onBack} fullWidth>
                {c('Action').t`Back to sign-in`}
            </Button>
        </div>
    );
};

export default SSODeviceRejected;
