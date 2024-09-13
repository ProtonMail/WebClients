import Icon from '@proton/components/components/icon/Icon';
import { ProtectionType } from '@proton/shared/lib/authlog';
import { PROTON_SENTINEL_NAME } from '@proton/shared/lib/constants';

import { Tooltip } from '../../components';

type Props = {
    protection?: ProtectionType | null;
    protectionDesc?: string | null;
};

const ProtectionTooltip = () => {
    return (
        <Tooltip title={PROTON_SENTINEL_NAME} openDelay={0} closeDelay={150} longTapDelay={0}>
            <Icon className="align-text-bottom color-primary" name="shield-filled" />
        </Tooltip>
    );
};

const ProtectionCell = ({ protection, protectionDesc }: Props) => {
    const protectionTooltip = protection ? <ProtectionTooltip /> : null;
    if (protection === ProtectionType.OK) {
        return protectionTooltip;
    }
    return (
        <>
            <span className="shrink-0 mr-2">{protectionTooltip}</span>
            <span className="flex-1">{protectionDesc || '-'}</span>
        </>
    );
};

export default ProtectionCell;
