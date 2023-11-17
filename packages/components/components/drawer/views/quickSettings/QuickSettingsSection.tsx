import { ReactNode } from 'react';

import clsx from '@proton/utils/clsx';

import './QuickSettingsSection.scss';

interface Props {
    children: ReactNode;
    className?: string;
}

const QuickSettingsSection = ({ children, className }: Props) => {
    return (
        <div
            className={clsx(
                'quickSettingsSection w-full flex-no-min-children flex-column gap-2 flex-item-noshrink justify-center px-4 py-2 rounded-lg shadow-norm',
                className
            )}
        >
            {children}
        </div>
    );
};

export default QuickSettingsSection;
