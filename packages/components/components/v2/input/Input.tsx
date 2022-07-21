import { ComponentPropsWithRef, forwardRef, ReactNode, Ref } from 'react';

import { classnames } from '../../../helpers';

export interface InputTwoProps extends Omit<ComponentPropsWithRef<'input'>, 'prefix'> {
    error?: ReactNode | boolean;
    disabled?: boolean;
    prefix?: ReactNode;
    suffix?: ReactNode;
    containerRef?: Ref<HTMLDivElement>;
    disableChange?: boolean;
    onValue?: (value: string) => void;
}

const InputTwo = (props: InputTwoProps, ref: Ref<HTMLInputElement>) => {
    const {
        error,
        disabled,
        prefix,
        suffix,
        className: classNameProp,
        onValue,
        disableChange,
        containerRef,
        ...rest
    } = props;

    const inputElement = (
        <input
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck="false"
            aria-invalid={!!error}
            disabled={disabled}
            {...rest}
            ref={ref}
            onChange={(e) => {
                if (disableChange) {
                    return;
                }
                onValue?.(e.target.value);
                rest.onChange?.(e);
            }}
            className={classnames(['field-two-input w100', classNameProp])}
        />
    );

    return (
        <div
            className={classnames([
                'field-two-input-wrapper flex flex-nowrap flex-align-items-stretch flex-item-fluid relative',
                Boolean(error) && 'error',
                disabled && 'disabled',
            ])}
            ref={containerRef}
        >
            {prefix && (
                <div className="field-two-input-adornment ml0-5 flex flex-align-items-center flex-item-noshrink flex-nowrap flex-gap-0-5">
                    {prefix}
                </div>
            )}

            <div className="flex-item-fluid">{inputElement}</div>

            {suffix && (
                <div className="field-two-input-adornment mr0-5 flex flex-align-items-center flex-item-noshrink flex-nowrap flex-gap-0-5">
                    {suffix}
                </div>
            )}
        </div>
    );
};

export default forwardRef<HTMLInputElement, InputTwoProps>(InputTwo);
