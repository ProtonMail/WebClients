import { ButtonHTMLAttributes, ReactElement, ReactNode, Ref, cloneElement, forwardRef } from 'react';



import noop from '@proton/utils/noop';



import { classnames } from '../../helpers';
import { Tooltip } from '../tooltip';


interface Props extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'title'> {
    icon?: ReactElement;
    children?: ReactNode;
    title?: ReactNode;
}

const ToolbarButton = (
    { icon, children, className, disabled, tabIndex, title, onClick, ...rest }: Props,
    ref: Ref<HTMLButtonElement>
) => {
    const content = (
        <button
            type="button"
            className={classnames([className, 'flex flex-item-noshrink toolbar-button'])}
            onClick={disabled ? noop : onClick}
            tabIndex={disabled ? -1 : tabIndex}
            disabled={disabled}
            ref={ref}
            {...rest}
        >
            {icon &&
                cloneElement(icon, {
                    className: classnames([icon.props.className, 'toolbar-icon m-auto']),
                })}
            {children}
        </button>
    );

    if (title) {
        return <Tooltip title={title}>{content}</Tooltip>;
    }

    return content;
};

export default forwardRef<HTMLButtonElement, Props>(ToolbarButton);