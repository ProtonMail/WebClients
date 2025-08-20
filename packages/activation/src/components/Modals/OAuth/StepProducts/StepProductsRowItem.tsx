import type { ReactNode } from 'react';

import { c } from 'ttag';

import { Checkbox, Label } from '@proton/components';
import clsx from '@proton/utils/clsx';

import StepPrepareDisabledCheckbox from '../StepPrepareOAuth/StepPrepareOAuthDisabledCheckbox';

interface Props {
    id: 'mail' | 'contact' | 'calendar';
    label: string;
    disabled?: boolean;
    value: boolean;
    setValue: (value: boolean) => void;
    error?: string;
    children?: ReactNode;
    disabledText?: ReactNode;
}

const StepProductsRowItem = ({
    id,
    label,
    disabled,
    value,
    setValue,
    error,
    children,
    disabledText = c('Label').t`(Temporarily unavailable. Please check back later.)`,
}: Props) => {
    if (error) {
        return <StepPrepareDisabledCheckbox id={id}>{error}</StepPrepareDisabledCheckbox>;
    }

    return (
        <Label
            htmlFor={id}
            className={clsx(['py-5 border-bottom flex label w-full', disabled && 'cursor-default color-weak'])}
            data-testid="StepProductsRowItem:label"
        >
            <Checkbox
                id={id}
                checked={disabled ? false : value}
                onChange={(e) => setValue(e.target.checked)}
                className="mr-2 self-start"
                disabled={disabled}
            />
            <div className="flex flex-column flex-1">
                <div className={clsx(disabled && 'color-weak')}>
                    {label}
                    {disabled && <span className="block">{disabledText}</span>}
                </div>
                {children}
            </div>
        </Label>
    );
};

export default StepProductsRowItem;
