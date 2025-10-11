import type { ComponentPropsWithoutRef } from 'react';

import type { ButtonLikeProps as TButtonLikeProps } from '@proton/atoms/Button/ButtonLike';
import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import clsx from '@proton/utils/clsx';

export interface InputButtonProps extends ComponentPropsWithoutRef<'input'> {
    id?: string;
    type?: 'checkbox' | 'radio';
    title?: string;
    checked?: boolean;
    labelProps?: ComponentPropsWithoutRef<'label'>;
    ButtonLikeProps?: TButtonLikeProps<'span'>;
}

const InputButton = ({
    id,
    title,
    checked,
    children,
    type = 'checkbox',
    labelProps = {},
    ButtonLikeProps = {},
    ...rest
}: InputButtonProps) => {
    const { className: labelClassNameProp, ...labelPropsRest } = labelProps;

    const labelClassName = clsx(['inline-flex relative', labelClassNameProp]);

    return (
        <label htmlFor={id} title={title} className={labelClassName} {...labelPropsRest}>
            <input id={id} type={type} className="input-button-input sr-only" checked={checked} {...rest} />

            <ButtonLike
                as="span"
                {...ButtonLikeProps}
                className={clsx(['input-button flex justify-center shrink-0 rounded-50', ButtonLikeProps.className])}
            >
                {children}
            </ButtonLike>
        </label>
    );
};

export default InputButton;
