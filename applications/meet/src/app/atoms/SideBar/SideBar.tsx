import clsx from '@proton/utils/clsx';

import { CloseButton } from '../CloseButton/CloseButton';

import './SideBar.scss';

interface SideBarProps {
    children: React.ReactNode;
    onClose: () => void;
    header?: React.ReactNode;
    absoluteHeader?: boolean;
    isScrolled?: boolean;
}

export const SideBar = ({ children, onClose, header, absoluteHeader = false, isScrolled = false }: SideBarProps) => {
    return (
        <div className="meet-side-bar bg-norm border border-norm flex flex-nowrap flex-column p-4 h-full w-full meet-radius relative max-w-full z-1">
            <div
                className={clsx(
                    'side-bar-header-wrapper flex items-center justify-space-between w-full pb-4 flex-nowrap',
                    absoluteHeader && 'absolute top-0 left-0 px-4 pt-4',
                    isScrolled && 'scrolled'
                )}
            >
                {header}

                <CloseButton onClose={onClose} />
            </div>

            {children}
        </div>
    );
};
