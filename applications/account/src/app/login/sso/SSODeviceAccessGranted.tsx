import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import useLoading from '@proton/hooks/useLoading';
import noop from '@proton/utils/noop';

import userCheck from '../../public/user-check.svg';

interface Props {
    onContinue: () => Promise<void>;
}

/**
 * Shown instead of {@link SSODeviceAdminGranted} followed by the new backup password form, when the
 * organization disabled the backup password. There is nothing for the member to set, so continuing
 * re-encrypts their keys with a random password and finishes the sign-in.
 */
const SSODeviceAccessGranted = ({ onContinue }: Props) => {
    const [loading, withLoading] = useLoading();

    return (
        <div className="flex flex-column items-center">
            <div className="mb-6">
                <img src={userCheck} alt="" />
            </div>
            <div className="h2 text-bold mb-2">{c('sso').t`Access granted`}</div>
            <div className="text-center color-weak mb-8">
                {c('sso').t`For your security, you have been signed out of all your other active devices.`}
            </div>
            <Button
                size="large"
                shape="solid"
                color="norm"
                type="button"
                fullWidth
                loading={loading}
                onClick={() => withLoading(onContinue()).catch(noop)}
            >
                {c('Action').t`Continue`}
            </Button>
        </div>
    );
};

export default SSODeviceAccessGranted;
