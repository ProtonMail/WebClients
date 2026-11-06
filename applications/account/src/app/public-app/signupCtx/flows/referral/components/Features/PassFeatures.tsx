import { c } from 'ttag';

import { IcAlias } from '@proton/icons/icons/IcAlias';
import { IcLink } from '@proton/icons/icons/IcLink';
import { IcShield } from '@proton/icons/icons/IcShield';

import FeatureItem from '../FeatureItem/FeatureItem';

export const PassFeatures = () => {
    return (
        <>
            <FeatureItem icon={<IcShield size={5} />} text={c('Signup').t`Built-in 2FA authenticator`} highlighted />
            <FeatureItem
                icon={<IcLink size={5} />}
                text={c('Signup').t`Secure vault sharing and link sharing`}
                highlighted
            />
            <FeatureItem
                icon={<IcAlias size={5} />}
                text={c('Signup').t`Unlimited hide-my-email aliases`}
                highlighted
            />
        </>
    );
};
