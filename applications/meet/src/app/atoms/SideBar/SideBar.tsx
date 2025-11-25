import clsx from '@proton/utils/clsx';

import { CloseButton } from '../CloseButton/CloseButton';

import './SideBar.scss';

interface SideBarProps {
    children: React.ReactNode;
    onClose: () => void;
    header?: React.ReactNode;
    absoluteHeader?: boolean;
    isScrolled?: boolean;
    paddingClassName?: string;
}

export const SideBar = ({
    children,
    onClose,
    header,
    absoluteHeader = false,
    isScrolled = false,
    paddingClassName = 'p-4',
}: SideBarProps) => {
    return (
        <div
            className={clsx(
                'meet-side-bar bg-norm border border-norm flex flex-nowrap flex-column h-full w-full meet-radius relative max-w-full z-1',
                paddingClassName
            )}
        >
            <div
                className={clsx(
                    'side-bar-header-wrapper flex items-center justify-space-between w-full flex-nowrap',
                    absoluteHeader && 'absolute top-0 left-0 px-4 pt-4',
                    isScrolled && 'scrolled',
                    !!header && 'pb-4'
                )}
            >
                {header}

                <div className={header ? '' : 'ml-auto'}>
                    <CloseButton onClose={onClose} />
                </div>
            </div>

            {children}
        </div>
    );
};
