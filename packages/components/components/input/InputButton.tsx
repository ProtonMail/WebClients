import { ComponentPropsWithoutRef } from 'react';
import { classnames } from '../../helpers';
import ButtonLike from '../button/ButtonLike';

export interface InputButtonProps extends ComponentPropsWithoutRef<'input'> {
    id?: string;
    type?: 'checkbox' | 'radio';
    title: string;
    checked: boolean;
    labelProps?: ComponentPropsWithoutRef<'label'>;
}

const InputButton = ({
    id,
    title,
    checked,
    children,
    type = 'checkbox',
    labelProps = {},
    ...rest
}: InputButtonProps) => {
    const { className: labelClassNameProp, ...labelPropsRest } = labelProps;

    const labelClassName = classnames(['inline-flex relative', labelClassNameProp]);

    return (
        <label htmlFor={id} title={title} className={labelClassName} {...labelPropsRest}>
            <input id={id} type={type} className="input-button-input sr-only" checked={checked} {...rest} />

            <ButtonLike as="span" className="input-button flex flex-justify-center flex-item-noshrink rounded-50">
                {children}
            </ButtonLike>
        </label>
    );
};

export default InputButton;
