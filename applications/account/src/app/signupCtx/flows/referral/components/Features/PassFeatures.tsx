import { c } from 'ttag';

import { DARK_WEB_MONITORING_NAME } from '@proton/shared/lib/constants';

import FeatureItem from '../FeatureItem/FeatureItem';

export const PassFeatures = () => {
    return (
        <>
            <FeatureItem text={c('Signup').t`Built-in 2FA authenticator`} highlighted />
            <FeatureItem text={c('Signup').t`Secure vault sharing and link sharing`} highlighted />
            <FeatureItem text={c('Signup').t`Custom fields and file attachment`} highlighted />
            <FeatureItem text={c('Signup').t`Unlimited hide-my-email aliases`} highlighted />
            <FeatureItem text={c('Signup').t`Mailboxes and custom domains for aliases`} highlighted />
            <FeatureItem text={DARK_WEB_MONITORING_NAME} highlighted />
        </>
    );
};
