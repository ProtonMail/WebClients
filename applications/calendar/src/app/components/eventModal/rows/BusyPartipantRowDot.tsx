import { CircleLoader } from '@proton/atoms/CircleLoader';
import { Icon, Tooltip } from '@proton/components/components';
import clsx from '@proton/utils/clsx';

const BusyParticipantRowDot = ({
    color,
    hasAvailability,
    isLoading,
    tooltipText,
}: {
    isLoading: boolean;
    color: string;
    hasAvailability: boolean;
    tooltipText: string;
}) => {
    return isLoading ? (
        <CircleLoader size="tiny" className="m-auto" style={{ color: color || 'black' }} />
    ) : (
        <div
            className={clsx(['m-auto relative flex', hasAvailability && 'rounded-full'])}
            style={{
                width: '0.625rem',
                height: '0.625rem',
                backgroundColor: hasAvailability ? color : 'transparent',
            }}
        >
            {!hasAvailability && (
                <Tooltip title={tooltipText}>
                    <Icon name="circle-half-filled" size={2.5} className="rotateZ-45 opacity-70" />
                </Tooltip>
            )}
        </div>
    );
};

export default BusyParticipantRowDot;
