import { c } from 'ttag';

import { Alert, Icon } from '../../components';

const MozillaInfoPanel = () => {
    return (
        <Alert className="mb-4" learnMore="https://support.mozilla.org/en-US/kb/protonvpn" type="warning">
            <Icon name="exclamation-circle" />
            {c('Info').t`Your subscription is managed by Mozilla. Please contact Mozilla support.`}
        </Alert>
    );
};

export default MozillaInfoPanel;
