import { ComponentPropsWithRef, forwardRef, ReactNode, Ref } from 'react';

import { classnames } from '../../../helpers';

export interface InputTwoProps extends Omit<ComponentPropsWithRef<'input'>, 'prefix'> {
    error?: ReactNode | boolean;
    suffix?: ReactNode;
    prefix?: ReactNode;
    icon?: ReactNode;
    disableChange?: boolean;
    onValue?: (value: string) => void;
}

const InputTwo = (props: InputTwoProps, ref: Ref<HTMLInputElement>) => {
    const { error, icon, suffix, prefix, className: classNameProp, onValue, disableChange, ...rest } = props;

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

    if (prefix) {
        return (
            <div className="inputform-icon-container flex flex-nowrap flex-align-items-center flex-item-fluid relative">
                <div className="inputform-prefix pr0-5 flex">{prefix}</div>
                <div className="flex-item-fluid">{inputElement}</div>
            </div>
        );
    }

    if (icon) {
        return (
            <div className="inputform-icon-container text-left relative">
                {inputElement}
                <span className="right-icon absolute flex">{icon}</span>
            </div>
        );
    }

    if (suffix) {
        return (
            <div className="inputform-icon-container flex flex-nowrap flex-align-items-center flex-item-fluid relative">
                <div className="flex-item-fluid">{inputElement}</div>
                <div className="inputform-suffix right-icon pr0-5 flex">{suffix}</div>
            </div>
        );
    }

    return inputElement;
};

export default forwardRef<HTMLInputElement, InputTwoProps>(InputTwo);
