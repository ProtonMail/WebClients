import type { ComponentPropsWithRef, ReactNode, Ref } from 'react';
import { forwardRef } from 'react';

import clsx from '@proton/utils/clsx';

export interface InputProps extends Omit<ComponentPropsWithRef<'input'>, 'prefix'> {
    onValue?: (value: string) => void;
    disableChange?: boolean;
    disabled?: boolean;
    error?: ReactNode | boolean;
    unstyled?: boolean;
    prefix?: ReactNode;
    suffix?: ReactNode;
    containerRef?: Ref<HTMLDivElement>;
    containerProps?: ComponentPropsWithRef<'div'>;
    inputContainerClassName?: string;
    inputClassName?: string;
    prefixClassName?: string;
}

const InputBase = (props: InputProps, ref: Ref<HTMLInputElement>) => {
    const {
        onValue,
        disableChange,
        disabled = false,
        error,
        unstyled,
        prefix,
        suffix,
        containerProps,
        containerRef,
        inputClassName,
        inputContainerClassName,
        prefixClassName,
        className: classNameProp,
        ...rest
    } = props;

    return (
        <div
            className={clsx(
                'input flex flex-nowrap items-stretch flex-1 relative',
                Boolean(error) && 'error',
                disabled && 'disabled',
                unstyled && 'unstyled',
                classNameProp
            )}
            ref={containerRef}
            data-testid="input-root"
            {...containerProps}
        >
            {prefix && (
                <div
                    className={clsx(
                        'input-adornment ml-2 flex items-center shrink-0 flex-nowrap gap-2',
                        prefixClassName
                    )}
                    data-testid="input-prefix"
                >
                    {prefix}
                </div>
            )}

            <div className={clsx('flex flex-1', inputContainerClassName)}>
                <input
                    autoComplete="off"
                    autoCapitalize="off"
                    autoCorrect="off"
                    spellCheck="false"
                    aria-invalid={!!error}
                    disabled={disabled}
                    data-testid="input-input-element"
                    {...rest}
                    ref={ref}
                    onChange={(e) => {
                        if (disableChange) {
                            return;
                        }
                        onValue?.(e.target.value);
                        rest.onChange?.(e);
                    }}
                    className={clsx('input-element w-full', inputClassName)}
                />
            </div>

            {suffix && (
                <div className="input-adornment mr-2 flex items-center shrink-0 flex-nowrap gap-2">{suffix}</div>
            )}
        </div>
    );
};

/*
export because of
https://github.com/storybookjs/storybook/issues/9511
https://github.com/styleguidist/react-docgen-typescript/issues/314
https://github.com/styleguidist/react-docgen-typescript/issues/215
*/
export const Input = forwardRef<HTMLInputElement, InputProps>(InputBase);
