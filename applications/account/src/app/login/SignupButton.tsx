import { Link } from 'react-router-dom';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { getAppHref } from '@proton/shared/lib/apps/helper';
import { APPS } from '@proton/shared/lib/constants';
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

    if (isElectronApp) {
        const handleSignupDesktop = () => {
            if (canInvokeInboxDesktopIPC) {
                window.ipcInboxMessageBroker!.send('openExternal', getAppHref(paths.signup, APPS.PROTONACCOUNT));
            }
        };

        return (
            <Button shape="underline" className="link link-focus text-nowrap" onClick={handleSignupDesktop}>
                {c('Link').t`Create account`}
            </Button>
        );
    }

    return (
        <Link className="link link-focus text-nowrap" to={paths.signup}>
            {c('Link').t`Create account`}
        </Link>
    );
};

export default SignupButton;
