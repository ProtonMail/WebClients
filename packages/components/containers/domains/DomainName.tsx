import Icon from '@proton/components/components/icon/Icon';
import type { Domain } from '@proton/shared/lib/interfaces';
import { DOMAIN_STATE } from '@proton/shared/lib/interfaces';

const { DOMAIN_STATE_DEFAULT, DOMAIN_STATE_VERIFIED, DOMAIN_STATE_WARN } = DOMAIN_STATE;

export interface Props {
    domain: Domain;
}

const DomainName = ({ domain }: Props) => {
    const ICONS = {
        [DOMAIN_STATE_DEFAULT]: <Icon className="color-danger shrink-0" type="error" name="cross-circle-filled" />,
        [DOMAIN_STATE_VERIFIED]: <Icon className="color-success shrink-0" name="checkmark-circle-filled" />,
        [DOMAIN_STATE_WARN]: <Icon className="color-warning shrink-0" type="warning" name="cross-circle-filled" />,
    };

    return (
        <span className="flex flex-nowrap items-center">
            {ICONS[domain.State]}
            <span className="text-ellipsis ml-2" title={domain.DomainName}>
                {domain.DomainName}
            </span>
        </span>
    );
};

export default DomainName;
