import { forwardRef, Ref } from 'react';
import { classnames } from '../../../helpers';

export interface TextAreaTwoProps extends Omit<React.ComponentPropsWithRef<'textarea'>, 'prefix'> {
    error?: React.ReactNode | boolean;
    disableChange?: boolean;
    onValue?: (value: string) => void;
}

const TextAreaTwo = (props: TextAreaTwoProps, ref: Ref<HTMLTextAreaElement>) => {
    const { error, className: classNameProp, onValue, disableChange, ...rest } = props;

    const className = classnames([classNameProp, 'w100 inputform-field', Boolean(error) && 'error']);

    return (
        <textarea
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
};

export default forwardRef<HTMLTextAreaElement, TextAreaTwoProps>(TextAreaTwo);
