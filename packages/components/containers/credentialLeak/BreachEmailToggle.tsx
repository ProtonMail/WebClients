import { c } from 'ttag';

import CredentialLeakToggle from './CredentialLeakToggle';

interface Props {
    enabled: boolean;
    loading: boolean;
    onToggle: (newState: boolean) => void;
}

const BreachEmailToggle = ({ enabled, ...rest }: Props) => {
    return (
        <CredentialLeakToggle
            id="breach-email-toggle"
            title={c('Info').t`Enable email notifications`}
            searchParam="dwm-unsubscribe"
            toggleCondition={enabled}
            nextToggleState={false}
            enabled={enabled}
            {...rest}
        />
    );
};

export default BreachEmailToggle;
