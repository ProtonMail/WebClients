import React from 'react';
import type { ReactNode } from 'react';

export const SettingsDescriptionItem = ({ children }: { children: ReactNode }) => {
    return <p className="m-0">{children}</p>;
};

interface Props {
    left: ReactNode;
    right?: React.ReactNode;
}

const SettingsDescription = ({ left, right }: Props) => {
    return (
        <div
            className="flex items-start justify-space-between gap-4 flex-nowrap mb-2 color-weak w-full max-w-custom"
            style={{ '--max-w-custom': '40.25rem' }}
        >
            <div className="w-full flex flex-column gap-2 flex-nowrap">{left}</div>
            {right && (
                <div
                    className="shrink-0 hidden md:block w-custom mt-custom"
                    style={{ '--w-custom': '5rem', '--mt-custom': '-0.3rem' }}
                >
                    {right}
                </div>
            )}
        </div>
    );
};

export default SettingsDescription;
