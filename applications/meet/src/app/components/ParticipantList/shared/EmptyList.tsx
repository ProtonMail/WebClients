import type { ReactNode } from 'react';

import './EmptyList.scss';

type Props = {
    icon: ReactNode;
    title: string;
    description: string;
};

export const EmptyList = ({ icon, title, description }: Props) => {
    return (
        <div className="flex flex-column flex-nowrap items-center justify-center text-center px-8 pt-20">
            <div
                className="empty-list-icon flex items-center justify-center shrink-0 rounded-full w-custom h-custom color-primary"
                style={{
                    '--w-custom': '4rem',
                    '--h-custom': '4rem',
                }}
            >
                {icon}
            </div>
            <p className="mt-4 mb-1 text-semibold">{title}</p>
            <p className="m-0 text-sm color-hint">{description}</p>
        </div>
    );
};
