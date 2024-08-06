import { c, msgid } from 'ttag';

import type { Logical } from '@proton/shared/lib/vpn/Logical';

interface Props {
    group: Logical[];
}

const ServerNumber = ({ group }: Props) => {
    const number = group.reduce((acc, { Servers }) => acc + (Servers?.length || 0), 0);
    return (
        <div className="inline-flex *:self-center">
            {c('Info').ngettext(msgid`${number} server`, `${number} servers`, number)}
        </div>
    );
};

export default ServerNumber;
