import type { ReactNode } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import type { ButtonProps } from '@proton/atoms/Button/Button';
import clsx from '@proton/utils/clsx';

const SettingsValueRowLabel = ({ children, className }: { children: ReactNode; className?: string }) => {
    return <span className={clsx('flex items-center gap-2 text-semibold', className)}>{children}</span>;
};

const SettingsValueRowDescription = ({ children }: { children: ReactNode }) => {
    return <p className="m-0 text-sm color-weak">{children}</p>;
};

const SettingsValueRowEditButton = (props: ButtonProps) => {
    return (
        <Button shape="outline" size="small" increasedClickArea className="shrink-0" {...props}>
            {c('Action').t`Change`}
        </Button>
    );
};

interface SettingsValueRowProps {
    label: ReactNode;
    value?: ReactNode;
    /** Rendered at the end of the row, e.g. an edit button. */
    action?: ReactNode;
}

const SettingsValueRow = ({ label, value, action }: SettingsValueRowProps) => {
    return (
        <div className="flex flex-column md:flex-row md:items-center md:justify-space-between flex-nowrap gap-1 md:gap-4">
            <div className="md:flex-1 flex w-full flex-nowrap items-center justify-space-between">
                <div className="md:flex-1 w- flex flex-column gap-1">{label}</div>
                {!value && action && <span className="align-self-end">{action}</span>}
            </div>
            {value && (
                <>
                    <div className="shrink-0 w-full md:w-1/2 max-w-full flex items-center flex-nowrap justify-space-between gap-2">
                        <div className="flex-1 color-weak text-ellipsis">{value}</div>
                        {action && <span className="align-self-end">{action}</span>}
                    </div>
                </>
            )}
        </div>
    );
};

SettingsValueRow.Label = SettingsValueRowLabel;
SettingsValueRow.Description = SettingsValueRowDescription;
SettingsValueRow.EditButton = SettingsValueRowEditButton;

export { SettingsValueRow };
