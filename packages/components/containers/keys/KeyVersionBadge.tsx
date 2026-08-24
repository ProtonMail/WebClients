import { c } from 'ttag';

import { Badge } from '../../components/badge/Badge';

interface Props {
    version: number;
}

const KeyVersionBadge = ({ version }: Props) => {
    if (version === 6) {
        return (
            <Badge className="ml-2 shrink-0" key="v6" tooltip={c('Tooltip').t`Version 6 OpenPGP key`} type="light">
                V6
            </Badge>
        );
    }
    return null;
};

export default KeyVersionBadge;
