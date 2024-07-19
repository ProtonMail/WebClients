import { c, msgid } from 'ttag';

import type { VPNServer } from '@proton/shared/lib/interfaces/VPNServer';

interface Props {
    group: VPNServer[];
}

const ServerNumber = ({ group }: Props) => {
    const number = group.reduce((acc, { Servers }) => acc + Servers.length, 0);
    return (
        <div className="inline-flex *:self-center">
            {c('Info').ngettext(msgid`${number} server`, `${number} servers`, number)}
        </div>
    );
};

export default ServerNumber;
