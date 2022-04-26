import { ComponentPropsWithRef, forwardRef, ReactNode, Ref } from 'react';

import { classnames } from '../../../helpers';

export interface InputTwoProps extends Omit<ComponentPropsWithRef<'input'>, 'prefix'> {
    error?: ReactNode | boolean;
    prefix?: ReactNode;
    suffix?: ReactNode;
    containerRef?: Ref<HTMLDivElement>;
    disableChange?: boolean;
    onValue?: (value: string) => void;
}

const InputTwo = (props: InputTwoProps, ref: Ref<HTMLInputElement>) => {
    const { error, prefix, suffix, className: classNameProp, onValue, disableChange, containerRef, ...rest } = props;

    const className = classnames([classNameProp, 'w100 inputform-field', Boolean(error) && 'error']);

    const inputElement = (
        <input
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck="false"
            aria-invalid={!!error}
            {...rest}
            ref={ref}
            onChange={(e) => {
                if (disableChange) {
                    return;
                }
                onValue?.(e.target.value);
                rest.onChange?.(e);
            }}
            className={className}
        />
    );

    return (
        <div
            className={classnames([
                'flex flex-nowrap flex-align-items-center flex-item-fluid relative',
                Boolean(prefix) && 'inputform-adornment-container--prefix',
                Boolean(suffix) && 'inputform-adornment-container--suffix',
            ])}
            ref={containerRef}
        >
            {prefix && <div className="inputform-adornment pl0-5 flex">{prefix}</div>}

            <div className="flex-item-fluid">{inputElement}</div>

            {suffix && <div className="inputform-adornment pr0-5 flex">{suffix}</div>}
        </div>
    );
};

export default forwardRef<HTMLInputElement, InputTwoProps>(InputTwo);
