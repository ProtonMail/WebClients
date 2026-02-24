import Icon from '@proton/components/components/icon/Icon';
import useUid from '@proton/components/hooks/useUid';

export const UpgradeIcon = () => {
    const uid = useUid('linear-gradient');
    return (
        <span>
            <Icon name={'upgrade'} className="shrink-0" size={4} style={{ fill: `url(#${uid}) var(--text-norm)` }} />
            <svg aria-hidden="true" focusable="false" className="sr-only">
                <linearGradient id={uid}>
                    <stop offset="0%" stopColor="var(--color-stop-1)" />
                    <stop offset="100%" stopColor="var(--color-stop-2)" />
                </linearGradient>
            </svg>
        </span>
    );
};
