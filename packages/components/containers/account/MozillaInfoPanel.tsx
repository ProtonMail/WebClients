import { c } from 'ttag';

import { Href } from '@proton/atoms';

import { Alert, Icon } from '../../components';

const MozillaInfoPanel = () => {
    return (
        <Alert className="mb-4" type="warning">
            <Icon name="exclamation-circle" />
            {c('Info').t`Your subscription is managed by Mozilla. Please contact Mozilla support.`}
            <div>
                <Href href="https://support.mozilla.org/en-US/kb/protonvpn">{c('Link').t`Learn more`}</Href>
            </div>
        </Alert>
    );
};

export default MozillaInfoPanel;
