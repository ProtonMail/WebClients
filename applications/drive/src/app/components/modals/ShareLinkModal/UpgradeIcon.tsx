import { Icon } from '@proton/components';
import useUid from '@proton/components/hooks/useUid';
import clsx from '@proton/utils/clsx';

export const UpgradeIcon = ({ className }: { className?: string }) => {
    const uid = useUid('linear-gradient');

    return (
        <>
            {/* Taken from PromotionButton.tsx */}
            <Icon
                data-testid="upgrade-icon"
                name="upgrade"
                className={clsx('shrink-0', className)}
                style={{ fill: `url(#${uid}) var(--text-norm)` }}
            />
            <svg aria-hidden="true" focusable="false" className="sr-only">
                <linearGradient id={uid}>
                    <stop offset="0%" stopColor="#fd4baf" />
                    <stop offset="100%" stopColor="#22d8ff" />
                </linearGradient>
            </svg>
        </>
    );
};
