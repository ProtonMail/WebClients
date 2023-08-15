import { ReactNode } from 'react';

import clsx from '@proton/utils/clsx';

interface ContactRowItemFirstLineProps {
    ID: string;
    Name: string;
    className?: string;
}

export const ContactRowItemFirstLine = ({ ID, Name, className }: ContactRowItemFirstLineProps) => {
    return (
        <div className="flex flex-nowrap flex-align-items-center item-firstline max-w100">
            <div className={clsx('flex flex-item-fluid w0', className)}>
                <span role="heading" aria-level={2} className="text-bold inline-block max-w100 text-ellipsis" id={ID}>
                    {Name}
                </span>
            </div>
        </div>
    );
};

interface ContactRowItemSecondLineProps {
    title: string;
    children: ReactNode;
}
export const ContactRowItemSecondLine = ({ title, children }: ContactRowItemSecondLineProps) => {
    return (
        <div className="item-secondline max-w100 text-ellipsis text-sm" title={title}>
            {children}
        </div>
    );
};
