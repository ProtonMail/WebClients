import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';

import clsx from '@proton/utils/clsx';

import SelectTwo from '../../components/selectTwo/SelectTwo';
import type { SelectTwoProps } from '../../components/selectTwo/SelectTwo';

const SettingsSelectRowContext = createContext<{ id: string }>({ id: '' });

const SettingsSelectRowLabel = ({
    children,
    className,
    ...rest
}: { children: ReactNode } & React.LabelHTMLAttributes<HTMLLabelElement>) => {
    const { id } = useContext(SettingsSelectRowContext);
    return (
        <label htmlFor={id} className={clsx('flex items-center gap-2 text-semibold', className)} {...rest}>
            {children}
        </label>
    );
};

const SettingsSelectRowDescription = ({ children }: { children: ReactNode }) => {
    return <p className="m-0 text-sm color-weak">{children}</p>;
};

const SettingsSelectRowSelect = <V,>(props: Omit<SelectTwoProps<V>, 'id'>) => {
    const { id } = useContext(SettingsSelectRowContext);
    return <SelectTwo id={id} {...props} />;
};

interface SettingsSelectRowProps {
    id: string;
    label: ReactNode;
    select: ReactNode;
}

const SettingsSelectRow = ({ id, label, select }: SettingsSelectRowProps) => {
    return (
        <SettingsSelectRowContext.Provider value={{ id }}>
            <div className="flex flex-column md:flex-row md:items-center md:justify-space-between flex-nowrap gap-1 md:gap-4">
                <div className="md:flex-1 flex flex-column gap-1">{label}</div>
                {/* Matches the 240px min width the select had under the previous settings-layout-right */}
                <div className="shrink-0 w-full max-w-custom" style={{ '--max-w-custom': '15rem' }}>
                    {select}
                </div>
            </div>
        </SettingsSelectRowContext.Provider>
    );
};

SettingsSelectRow.Label = SettingsSelectRowLabel;
SettingsSelectRow.Description = SettingsSelectRowDescription;
SettingsSelectRow.Select = SettingsSelectRowSelect;

export { SettingsSelectRow };
