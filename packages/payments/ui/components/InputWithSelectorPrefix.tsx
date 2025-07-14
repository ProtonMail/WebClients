import type { ReactNode } from 'react';

import { Input, type InputProps } from '@proton/atoms';
import Icon from '@proton/components/components/icon/Icon';
import clsx from '@proton/utils/clsx';

import './InputWithSelectorPrefix.scss';

export const WarningIcon = ({ className }: { className?: string }) => {
    return <Icon name="exclamation-circle-filled" className={clsx('shrink-0 color-danger', className)} size={4.5} />;
};

export type InputWithSelectorPrefixProps = {
    prefix: ReactNode;
    placeholder?: string;
    className?: string;
    inputClassName?: string;
    prefixClassName?: string;
    'aria-describedby'?: string;
    errorTestId?: string;
    showError?: boolean;
} & InputProps;

export const InputWithSelectorPrefix = ({
    prefix,
    placeholder,
    className,
    inputClassName,
    prefixClassName,
    error,
    errorTestId,
    'aria-describedby': ariaDescribedby,
    showError = true,
    ...rest
}: InputWithSelectorPrefixProps) => {
    return (
        <>
            <span className="sr-only" id="id_desc_postal">
                {rest.title}
            </span>
            <Input
                placeholder={placeholder}
                className={clsx('selector-prefix-input justify-space-between divide-x', className)}
                inputClassName={inputClassName || 'ml-1'}
                prefixClassName={clsx('flex-1', prefixClassName)}
                prefix={prefix}
                aria-describedby={ariaDescribedby}
                error={error}
                suffix={error ? <WarningIcon className="mr-2" /> : null}
                {...rest}
            />
            {showError && (
                <div className="error-container mt-1 text-semibold text-sm flex">
                    {error && (
                        <>
                            <WarningIcon className="mr-1" />
                            <span data-testid={errorTestId}>{error}</span>
                        </>
                    )}
                </div>
            )}
        </>
    );
};
