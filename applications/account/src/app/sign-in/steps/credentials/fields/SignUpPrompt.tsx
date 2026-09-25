import { c } from 'ttag';

import { BRAND_NAME } from '@proton/shared/lib/constants';

import type { Paths } from '../../../../content/helper';
import SignupButton from './SignupButton';

export const SignUpPrompt = ({ paths, className }: { paths: Paths; className: string }) => {
    if (!paths.signup) {
        return null;
    }
    const signUp = <SignupButton paths={paths} key="signup" />;
    return (
        <div className={className}>
            {
                // translator: Full sentence "New to Proton? Create account"
                c('Go to sign up').jt`New to ${BRAND_NAME}? ${signUp}`
            }
        </div>
    );
};
