import { IcCheckmarkCircleFilled } from '@proton/icons/icons/IcCheckmarkCircleFilled';
import { IcCrossCircleFilled } from '@proton/icons/icons/IcCrossCircleFilled';
import type { Domain } from '@proton/shared/lib/interfaces';
import { DOMAIN_STATE } from '@proton/shared/lib/interfaces';

const { DOMAIN_STATE_DEFAULT, DOMAIN_STATE_VERIFIED, DOMAIN_STATE_WARN } = DOMAIN_STATE;

export interface Props {
    domain: Domain;
}

const DomainName = ({ domain }: Props) => {
    const ICONS = {
        [DOMAIN_STATE_DEFAULT]: <IcCrossCircleFilled className="color-danger shrink-0" type="error" />,
        [DOMAIN_STATE_VERIFIED]: <IcCheckmarkCircleFilled className="color-success shrink-0" />,
        [DOMAIN_STATE_WARN]: <IcCrossCircleFilled className="color-warning shrink-0" type="warning" />,
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
