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
                'quickSettingsButtonSection mt-auto w-full flex children-min-size-auto flex-column shrink-0 justify-center gap-2',
                className
            )}
        >
            {children}
        </div>
    );
};

export default QuickSettingsButtonSection;
