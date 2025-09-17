import { Icon } from '@proton/components';
import { PROTON_SENTINEL_SHORT_NAME } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';

export const SentinelBadge = ({ className }: { className?: string }) => {
    return (
        <span
            className={clsx(
                'text-sm color-primary py-0.5 px-1 rounded-sm bg-weak text-bold flex items-center gap-1',
                className
            )}
        >
            <Icon name="shield-filled" size={4} />
            {PROTON_SENTINEL_SHORT_NAME}
        </span>
    );
};
