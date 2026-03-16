import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';

import Toggle from '@proton/components/components/toggle/Toggle';
import type { ToggleProps } from '@proton/components/components/toggle/Toggle';

const SettingsToggleRowContext = createContext<{ id: string }>({ id: '' });

const SettingsToggleRowLabel = ({
    children,
    ...rest
}: { children: ReactNode } & React.LabelHTMLAttributes<HTMLLabelElement>) => {
    const { id } = useContext(SettingsToggleRowContext);
    return (
        <label htmlFor={id} className="flex items-center gap-2 text-semibold mb-1" {...rest}>
            {children}
        </label>
    );
};

const SettingsToggleRowDescription = ({ children }: { children: ReactNode }) => {
    return <p className="m-0 text-sm color-weak">{children}</p>;
};

const SettingsToggleRowToggle = (props: Omit<ToggleProps, 'id'>) => {
    const { id } = useContext(SettingsToggleRowContext);
    return <Toggle id={id} {...props} />;
};

interface SettingsToggleRowProps {
    id: string;
    label: ReactNode;
    toggle: ReactNode;
}

const SettingsToggleRow = ({ id, label, toggle }: SettingsToggleRowProps) => {
    return (
        <SettingsToggleRowContext.Provider value={{ id }}>
            <div className="flex items-center justify-space-between flex-nowrap gap-1">
                <div className="flex-1">{label}</div>
                {toggle}
            </div>
        </SettingsToggleRowContext.Provider>
    );
};

SettingsToggleRow.Label = SettingsToggleRowLabel;
SettingsToggleRow.Description = SettingsToggleRowDescription;
SettingsToggleRow.Toggle = SettingsToggleRowToggle;

export { SettingsToggleRow };
