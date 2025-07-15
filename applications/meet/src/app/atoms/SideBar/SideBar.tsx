import clsx from '@proton/utils/clsx';

import { CloseButton } from '../CloseButton/CloseButton';

import './SideBar.scss';

interface SideBarProps {
    children: React.ReactNode;
    onClose: () => void;
    header?: React.ReactNode;
    absoluteHeader?: boolean;
}

export const SideBar = ({ children, onClose, header, absoluteHeader = false }: SideBarProps) => {
    return (
        <div className="meet-side-bar bg-norm border border-norm flex flex-nowrap flex-column p-4 h-full w-full meet-radius relative max-w-full z-1">
            <div
                className={clsx(
                    'side-bar-header-wrapper flex items-center justify-space-between w-full pb-4 bg-norm flex-nowrap',
                    absoluteHeader && 'absolute top-0 left-0 px-4 pt-4'
                )}
                style={{ opacity: 0.9 }}
            >
                {header}

                <CloseButton onClose={onClose} />
            </div>

            {children}
        </div>
    );
};
