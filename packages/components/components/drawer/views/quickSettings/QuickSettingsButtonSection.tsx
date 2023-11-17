import { ReactNode } from 'react';

import clsx from '@proton/utils/clsx';

interface Props {
    children: ReactNode;
    className?: string;
}

const QuickSettingsButtonSection = ({ children, className }: Props) => {
    return (
        <div
            className={clsx(
                'quickSettingsButtonSection mt-auto w-full flex-no-min-children flex-column flex-item-noshrink justify-center gap-2',
                className
            )}
        >
            {children}
        </div>
    );
};

export default QuickSettingsButtonSection;
