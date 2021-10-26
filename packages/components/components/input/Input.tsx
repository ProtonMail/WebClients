import {
    cloneElement,
    DetailedHTMLProps,
    forwardRef,
    InputHTMLAttributes,
    KeyboardEventHandler,
    ReactElement,
    ReactNode,
    Ref,
    useState,
} from 'react';
import { c } from 'ttag';

import { generateUID, classnames } from '../../helpers';
import useInput from './useInput';
import ErrorZone from '../text/ErrorZone';

import Icon from '../icon/Icon';

export interface Props extends DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement> {
    ref?: Ref<HTMLInputElement>; // override ref so that LegacyRef isn't used
    containerRef?: Ref<HTMLDivElement>;
    icon?: ReactElement;
    iconSearchDisplayed?: boolean;
    error?: string;
    errorZoneClassName?: string;
    autoComplete?: string;
    className?: string;
    onPressEnter?: KeyboardEventHandler<HTMLInputElement>;
    isSubmitted?: boolean;
    loading?: boolean;
}

/**
 * @deprecated please use InputTwo or InputFieldTwo instead
 */
const Input = forwardRef<HTMLInputElement, Props>(
    (
        {
            containerRef,
            icon,
            error,
            errorZoneClassName,
            autoComplete = 'off',
            className = '',
            type = 'text',
            iconSearchDisplayed = true,
            onPressEnter,
            isSubmitted,
            loading = false,
            required = false,
            id,
            placeholder,
            value,
            ...rest
        },
        ref
    ) => {
        const { handlers, statusClasses, status } = useInput<HTMLInputElement>({ onPressEnter, ...rest });
        const [uid] = useState(generateUID('input'));
        const errorZone = required && !value && value !== 0 && !error ? c('Error').t`This field is required` : error;

        const hasError = !!(errorZone && (status.isDirty || isSubmitted));

        const addIconWrapper = (child: ReactNode) => {
            if (type === 'search' && iconSearchDisplayed) {
                return (
                    <div
                        ref={containerRef}
                        className={classnames(['relative flex', hasError && 'field-icon-container--invalid'])}
                    >
                        <Icon name="magnifying-glass" className="absolute no-pointer-events left-icon" />
                        {child}
                    </div>
                );
            }

            if (!icon) {
                return child;
            }

            return (
                <div
                    ref={containerRef}
                    className={classnames([
                        'relative field-icon-container w100',
                        hasError && 'field-icon-container--invalid',
                    ])}
                >
                    {child}
                    {cloneElement(icon, {
                        className: classnames([icon.props.className, 'right-icon absolute flex']),
                    })}
                </div>
            );
        };

        return (
            <>
                {id && placeholder ? (
                    <label className="sr-only" htmlFor={id}>
                        {placeholder}
                    </label>
                ) : null}
                {addIconWrapper(
                    <input
                        className={classnames(['field w100', className, statusClasses])}
                        aria-invalid={hasError}
                        aria-describedby={uid}
                        id={id}
                        ref={ref}
                        type={type}
                        value={value}
                        placeholder={placeholder}
                        autoComplete={autoComplete}
                        disabled={loading || rest.disabled}
                        required={required}
                        {...rest}
                        {...handlers}
                    />
                )}

                {hasError && (
                    <ErrorZone className={errorZoneClassName} id={uid}>
                        {errorZone}
                    </ErrorZone>
                )}
            </>
        );
    }
);

export default Input;
