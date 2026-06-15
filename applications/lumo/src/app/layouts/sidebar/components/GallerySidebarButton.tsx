import { useCallback } from 'react';
import { useHistory, useRouteMatch } from 'react-router-dom';

import { c } from 'ttag';

import type { IconSize } from '@proton/icons/types';

import { SidebarItem } from './SidebarItem';

interface Props {
    onItemClick: () => void;
}

interface LucideGalleryIconProps {
    size?: IconSize;
    className?: string;
}

const LucideGalleryIcon = ({ size = 4, className = '' }: LucideGalleryIconProps) => {
    return (
        <>
            {/* eslint-disable-next-line jsx-a11y/prefer-tag-over-role */}
            <svg
                viewBox="0 0 20 20"
                className={`icon-size-${size} ${className}`}
                role="img"
                focusable="false"
                aria-hidden="true"
            >
                <path
                    d="M18.3333 9.16671L17.2533 8.08671C17.0674 7.89926 16.8462 7.75047 16.6024 7.64893C16.3587 7.54739 16.0973 7.49512 15.8333 7.49512C15.5693 7.49512 15.3079 7.54739 15.0641 7.64893C14.8204 7.75047 14.5992 7.89926 14.4133 8.08671L9.16663 13.3334"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <path
                    d="M3.33329 6.66663C2.89127 6.66663 2.46734 6.84222 2.15478 7.15478C1.84222 7.46734 1.66663 7.89127 1.66663 8.33329V16.6666C1.66663 17.1087 1.84222 17.5326 2.15478 17.8451C2.46734 18.1577 2.89127 18.3333 3.33329 18.3333H11.6666C12.1087 18.3333 12.5326 18.1577 12.8451 17.8451C13.1577 17.5326 13.3333 17.1087 13.3333 16.6666"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <path
                    d="M10.8333 6.66667C11.2935 6.66667 11.6666 6.29357 11.6666 5.83333C11.6666 5.3731 11.2935 5 10.8333 5C10.3731 5 9.99997 5.3731 9.99997 5.83333C9.99997 6.29357 10.3731 6.66667 10.8333 6.66667Z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <path
                    d="M8.33329 1.66663H16.6666C17.5871 1.66663 18.3333 2.41282 18.3333 3.33329V11.6666C18.3333 12.5871 17.5871 13.3333 16.6666 13.3333H8.33329C7.41282 13.3333 6.66663 12.5871 6.66663 11.6666V3.33329C6.66663 2.41282 7.41282 1.66663 8.33329 1.66663Z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        </>
    );
};

export const GallerySidebarButton = ({ onItemClick }: Props) => {
    const history = useHistory();
    const isActive = useRouteMatch('/gallery');

    const handleClick = useCallback(() => {
        history.push('/gallery');
        onItemClick();
    }, [history, onItemClick]);

    return (
        <SidebarItem
            icon={LucideGalleryIcon}
            label={c('collider_2025:Button').t`Gallery`}
            onClick={handleClick}
            className={isActive ? 'sidebar-item--active' : undefined}
        />
    );
};
