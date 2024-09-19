import { c } from 'ttag';

import Icon from '@proton/components/components/icon/Icon';
import Tooltip from '@proton/components/components/tooltip/Tooltip';

import { isChainedForwarding } from './helpers';

interface Props {
    chainedEmails: string[];
    forwardEmail: string;
}

const WarningChainedForwarding = ({ chainedEmails, forwardEmail }: Props) => {
    if (!isChainedForwarding(chainedEmails, forwardEmail)) {
        return null;
    }
    return (
        <Tooltip
            title={c('email_forwarding_2023: Forwarding tooltip')
                .t`Emails forwarded to you are excluded and will not be forwarded.`}
        >
            <Icon
                name="exclamation-triangle-filled"
                className="mr-2 color-warning"
                alt={c('email_forwarding_2023: Warning').t`Warning`}
            />
        </Tooltip>
    );
};

export default WarningChainedForwarding;
