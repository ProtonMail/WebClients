import { DARK_WEB_MONITORING_NAME } from '@proton/shared/lib/constants';

import CredentialLeakToggle from './CredentialLeakToggle';
import { getEnableString } from './helpers';

interface Props {
    enabled: boolean;
    loading: boolean;
    onToggle: (newState: boolean) => void;
}

const BreachMonitoringToggle = ({ enabled, ...rest }: Props) => {
    return (
        <CredentialLeakToggle
            id="breach-monitoring-toggle"
            title={getEnableString(DARK_WEB_MONITORING_NAME)}
            searchParam="dwm-enable"
            toggleCondition={!enabled}
            nextToggleState={true}
            enabled={enabled}
            {...rest}
        />
    );
};

export default BreachMonitoringToggle;
