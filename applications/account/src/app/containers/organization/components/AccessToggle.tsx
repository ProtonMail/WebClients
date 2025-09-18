import type { PropsWithChildren, ReactElement } from 'react';

import { clsx } from 'clsx';

import { SettingsSectionWide, Toggle } from '@proton/components';

interface AccessToggleProps extends PropsWithChildren {
    id: string;
    icon: ReactElement;
    title: string;
    checked: boolean;
    loading: boolean;
    onChange: () => void;
    className?: string;
}

export const AccessToggle = ({
    id,
    icon,
    title,
    checked,
    loading,
    onChange,
    className,
    children,
}: AccessToggleProps) => {
    return (
        <SettingsSectionWide className={clsx('pb-2 border-bottom border-weak flex flex-nowrap gap-2', className)}>
            {icon}
            <div className="flex-1 flex flex-column">
                <h3 className="text-rg mb-1 text-semibold">{title}</h3>
                {children && <p className="text-wrap-balance color-weak m-0">{children}</p>}
            </div>
            <Toggle id={id} checked={checked} loading={loading} onChange={onChange} />
        </SettingsSectionWide>
    );
};
