import { useLocation } from 'react-router-dom';

import type { OnLoginCallback } from '@proton/components/containers/app/interface';

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

    const prefilledParams = decodeActivationParams(location.hash);

    return <ActivationForm prefilledParams={prefilledParams} onLogin={onLogin} />;
};

export default Activation;
