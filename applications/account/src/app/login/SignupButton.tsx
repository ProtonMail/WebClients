import { Link } from 'react-router-dom';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { canInvokeInboxDesktopIPC } from '@proton/shared/lib/desktop/ipcHelpers';
import { isElectronApp } from '@proton/shared/lib/helpers/desktop';

import { type Paths } from '../content/helper';

interface Props {
    paths: Paths;
}

const SignupButton = ({ paths }: Props) => {
    if (!paths.signup) {
        return null;
    }

    const handleSignupDesktop = () => {
        if (canInvokeInboxDesktopIPC) {
            window.ipcInboxMessageBroker?.send('openExternal', `${window.location.origin}/mail/signup`);
        }
    };

    if (isElectronApp) {
        return (
            <Button
                key="desktop-signup"
                shape="underline"
                className="link link-focus text-nowrap"
                onClick={handleSignupDesktop}
            >
                {c('Link').t`Create account`}
            </Button>
        );
    }

    return (
        <Link key="signup" className="link link-focus text-nowrap" to={paths.signup}>
            {c('Link').t`Create account`}
        </Link>
    );
};

export default SignupButton;
