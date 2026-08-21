import './VolumeMeter.scss';

interface VolumeMeterProps {
    /** Normalized level, between 0 and 1 */
    level: number;
    ariaLabel: string;
}

export const VolumeMeter = ({ level, ariaLabel }: VolumeMeterProps) => {
    const clampedLevel = Math.min(Math.max(level, 0), 1);

    return (
        // eslint-disable-next-line jsx-a11y/prefer-tag-over-role
        <div
            className="volume-meter w-full h-2 rounded-full"
            role="meter"
            aria-label={ariaLabel}
            aria-valuemin={0}
            aria-valuemax={1}
            aria-valuenow={clampedLevel}
        >
            <div
                className="volume-meter-fill h-full w-custom rounded-full"
                style={{ '--w-custom': `${clampedLevel * 100}%` }}
            />
        </div>
    );
};
