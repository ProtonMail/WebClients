import { ReactNode } from 'react';

import clsx from '@proton/utils/clsx';

interface ContactRowItemFirstLineProps {
    ID: string;
    Name: string;
    className?: string;
}

export const ContactRowItemFirstLine = ({ ID, Name, className }: ContactRowItemFirstLineProps) => {
    return (
        <div className="flex flex-nowrap items-center item-firstline max-w-full">
            <div className={clsx('flex flex-item-fluid w-0', className)}>
                <span role="heading" aria-level={2} className="text-bold inline-block max-w-full text-ellipsis" id={ID}>
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
        <div className="item-secondline max-w-full text-ellipsis text-sm" title={title}>
            {children}
        </div>
    );
};
