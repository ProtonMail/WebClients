import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import Icon from '@proton/components/components/icon/Icon';
import { ProtectionType } from '@proton/shared/lib/authlog';
import { PROTON_SENTINEL_NAME } from '@proton/shared/lib/constants';

type Props = {
    protection?: ProtectionType | null;
    protectionDesc?: string | null;
    isB2B?: boolean;
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
        <div className="flex flex-row">
            <div className="mr-2 self-center">{protectionTooltip}</div>
            <div className="flex-1">{protectionDesc || '-'}</div>
        </div>
    );
};

export default ProtectionCell;
