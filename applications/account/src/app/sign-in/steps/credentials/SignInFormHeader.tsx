import { c } from 'ttag';

import { BRAND_NAME } from '@proton/shared/lib/constants';

import type { SignInScreenProps } from '../../routes/signInRoute';
import { useSignInProps } from '../../wizard/SignInProvider';
import { useTestflightSubTitle, useTestflightTitle } from './Testflight';
import { getContinueTo } from './continueTo';

/**
 * The sign-in form's heading, which its auto screen (the username first) and its password screen share: the app the
 * sign-in continues to, or else what to enter. The testflight variant's title and subtitle show instead.
 */
export const SignInFormHeader = ({ onBack }: SignInScreenProps) => {
    const signInProps = useSignInProps();
    const { layout } = signInProps;
    const continueTo = getContinueTo(signInProps);
    const title = useTestflightTitle() ?? c('Title').t`Sign in`;
    const subTitle = useTestflightSubTitle() ?? (continueTo || c('Info').t`Enter your ${BRAND_NAME} Account details.`);
    return <layout.Header title={title} subTitle={subTitle} onBack={onBack} />;
};
