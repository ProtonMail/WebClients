import { c } from 'ttag';

import { Tooltip } from '@proton/atoms';
import Icon from '@proton/components/components/icon/Icon';

import { isChainedForwarding } from './forwardHelper';

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
