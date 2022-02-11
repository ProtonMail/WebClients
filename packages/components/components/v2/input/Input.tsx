import { ComponentPropsWithRef, forwardRef, ReactNode, Ref } from 'react';

import { classnames } from '../../../helpers';

export interface InputTwoProps extends Omit<ComponentPropsWithRef<'input'>, 'prefix'> {
    error?: ReactNode | boolean;
    suffix?: ReactNode;
    prefix?: ReactNode;
    icon?: ReactNode;
    containerRef?: Ref<HTMLDivElement>;
    disableChange?: boolean;
    onValue?: (value: string) => void;
}

const InputTwo = (props: InputTwoProps, ref: Ref<HTMLInputElement>) => {
    const {
        error,
        icon,
        suffix,
        prefix,
        className: classNameProp,
        onValue,
        disableChange,
        containerRef,
        ...rest
    } = props;

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
                'inputform-icon-container',
                Boolean(icon) && 'text-left relative',
                (prefix || suffix) && 'flex flex-nowrap flex-align-items-center flex-item-fluid relative',
            ])}
            ref={containerRef}
        >
            {prefix && <div className="inputform-prefix pr0-5 flex">{prefix}</div>}

            <div className={prefix || suffix ? 'flex-item-fluid' : undefined}>{inputElement}</div>

            {icon && <span className="right-icon absolute flex">{icon}</span>}

            {suffix && (
                <div className="inputform-suffix right-icon pr0-5 flex">
                    <span className="mauto">{suffix}</span>
                </div>
            )}
        </div>
    );
};

export default forwardRef<HTMLInputElement, InputTwoProps>(InputTwo);
