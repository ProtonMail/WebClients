import Icon from '@proton/components/components/icon/Icon';
import type { IconProps } from '@proton/components/components/icon/Icon';
import useUid from '@proton/components/hooks/useUid';
import clsx from '@proton/utils/clsx';

import './LumoSidebarListItemContentIcon.scss';

const LumoSidebarListItemContentIcon = ({ className, ...rest }: IconProps) => {
    const uid = useUid('lumo-linear-gradient');

    return (
        <>
            <Icon
                className={clsx('shrink-0 self-center my-auto', className)}
                style={{ fill: `url(#${uid}) var(--text-norm)` }}
                {...rest}
            />
            <svg aria-hidden="true" focusable="false" className="lumo-sidebar-icon sr-only">
                <linearGradient id={uid}>
                    <stop offset="0%" stopColor="var(--upgrade-color-stop-1)" />
                    <stop offset="100%" stopColor="var(--upgrade-color-stop-2)" />
                </linearGradient>
            </svg>
        </>
    );
};

export default LumoSidebarListItemContentIcon;
