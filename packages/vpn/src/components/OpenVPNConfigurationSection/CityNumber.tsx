import { c, msgid } from 'ttag';

import type { Logical } from '@proton/shared/lib/vpn/Logical';
import uniqueBy from '@proton/utils/uniqueBy';

interface Props {
    group: Logical[];
}

const CityNumber = ({ group }: Props) => {
    const number = uniqueBy(group, ({ City }) => City).length;
    return (
        <div className="inline-flex *:self-center">
            {c('Info').ngettext(msgid`${number} city`, `${number} cities`, number)}
        </div>
    );
};

export default CityNumber;
