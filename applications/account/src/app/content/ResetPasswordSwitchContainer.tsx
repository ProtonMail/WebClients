import { useLocation } from 'react-router-dom';

import type { OnLoginCallback } from '@proton/components';
import type { ProductParam } from '@proton/shared/lib/apps/product';
import type { APP_NAMES } from '@proton/shared/lib/constants';

import ResetPasswordContainer from '../reset/ResetPasswordContainer';
import { UnauthedForgotPassword } from '../unauthed-forgot-password/UnauthedForgotPassword';
import type { MetaTags } from '../useMetaTags';
import { useMetaTags } from '../useMetaTags';

interface Props {
    onLogin: OnLoginCallback;
    toApp: APP_NAMES | undefined;
    setupVPN: boolean;
    loginUrl: string;
    metaTags: MetaTags;
    productParam: ProductParam;
    onPreSubmit: () => Promise<void>;
    onStartAuth: () => Promise<void>;
}

const ResetPasswordSwitchContainer = ({
    metaTags,
    onPreSubmit,
    onStartAuth,
    toApp,
    onLogin,
    setupVPN,
    loginUrl,
    productParam,
}: Props) => {
    useMetaTags(metaTags);

    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);

    const renderUnauthedForgotPasswordFlow = searchParams.get('variant')?.toLowerCase() === 'b';

    if (renderUnauthedForgotPasswordFlow) {
        return (
            <UnauthedForgotPassword
                toApp={toApp}
                onLogin={onLogin}
                setupVPN={setupVPN}
                loginUrl={loginUrl}
                productParam={productParam}
                onPreSubmit={onPreSubmit}
                onStartAuth={onStartAuth}
            />
        );
    }

    return (
        <ResetPasswordContainer
            toApp={toApp}
            onLogin={onLogin}
            setupVPN={setupVPN}
            loginUrl={loginUrl}
            productParam={productParam}
            onPreSubmit={onPreSubmit}
            onStartAuth={onStartAuth}
        />
    );
};

export default ResetPasswordSwitchContainer;
