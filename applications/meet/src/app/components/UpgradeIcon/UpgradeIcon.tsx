import { Icon } from '@proton/components';
import useUid from '@proton/components/hooks/useUid';

import './UpgradeIcon.scss';

export const UpgradeIcon = () => {
    const uid = useUid('linear-gradient');

    return (
        <span className="upgrade-icon inline-flex">
            <Icon
                name="upgrade"
                size={5}
                className="apps-dropdown-button-icon shrink-0 no-print"
                style={{ fill: `url(#${uid})` }}
            />
            <svg width="0" height="0" style={{ position: 'absolute' }}>
                <defs>
                    <linearGradient id={uid} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="var(--upgrade-color-stop-1)" />
                        <stop offset="50%" stopColor="var(--upgrade-color-stop-2)" />
                        <stop offset="100%" stopColor="var(--upgrade-color-stop-3)" />
                    </linearGradient>
                </defs>
            </svg>
        </span>
    );
};
