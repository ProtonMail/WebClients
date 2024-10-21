import { c } from 'ttag';

import { Button } from '@proton/atoms';

import userCheck from '../../public/user-check.svg';

const SSODeviceAdminGranted = ({ onContinue }: { onContinue: () => void }) => {
    return (
        <div className="flex flex-column items-center">
            <div className="mb-6">
                <img src={userCheck} alt="" />
            </div>
            <div className="h2 text-bold mb-2">{c('sso').t`Access granted`}</div>
            <div className="text-center color-weak mb-8">
                {c('sso')
                    .t`For your security, you have been signed out of all your other active devices. Before accessing your account, you’ll need to enter a new backup password.`}
            </div>
            <Button size="large" shape="solid" color="norm" type="button" onClick={onContinue} fullWidth>
                {c('Action').t`Continue`}
            </Button>
        </div>
    );
};

export default SSODeviceAdminGranted;
