import { c } from 'ttag';

import clsx from '@proton/utils/clsx';

import './NewPill.scss';

interface NewPillProps {
    className?: string;
    children: React.ReactNode;
}

export const NewPill = ({ className, children }: NewPillProps) => {
    return (
        <div className="flex flex-nowrap items-center">
            <span
                className={clsx(
                    'new-pill inline-flex flex-nowrap items-center shrink-0 gap-1.5 py-1.5 border rounded-full color-success text-xs meet-font-weight text-uppercase',
                    className
                )}
            >
                <span className="new-pill-dot shrink-0 rounded-full bg-success" />
                {c('Info').t`New`}
            </span>
            {children}
        </div>
    );
};
