import { Redirect, useLocation } from 'react-router-dom';

import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import type { OnLoginCallback } from '@proton/components/containers/app/interface';
import { SSO_PATHS } from '@proton/shared/lib/constants';
import { useFlagsStatus } from '@proton/unleash/proxy';
import { useFlag } from '@proton/unleash/useFlag';

import { type MetaTags, useMetaTags } from '../../../../useMetaTags';
import ActivationForm from './ActivationForm';
import { decodeActivationParams } from './helpers/activationHelpers';

interface ActivationProps {
    onLogin: OnLoginCallback;
    metaTags: MetaTags;
}

const Activation = ({ onLogin, metaTags }: ActivationProps) => {
    useMetaTags(metaTags);
    const location = useLocation();
    const { flagsReady } = useFlagsStatus();
    const isBornPrivateActivationRecoveryEnabled = useFlag('BornPrivateActivationRecovery');

    if (!flagsReady) {
        return (
            <div className="flex items-center justify-center h-full w-full">
                <CircleLoader size="large" />
            </div>
        );
    }

    if (!isBornPrivateActivationRecoveryEnabled) {
        return <Redirect to={SSO_PATHS.LOGIN} />;
    }

    const prefilledParams = decodeActivationParams(location.hash);

    return <ActivationForm prefilledParams={prefilledParams} onLogin={onLogin} />;
};

export default Activation;
