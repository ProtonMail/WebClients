import React, { ButtonHTMLAttributes, ReactNode } from 'react';
import { classnames } from '../../helpers/component';
import Icon, { Props as IconProps } from '../icon/Icon';
import { noop } from 'proton-shared/lib/helpers/function';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
    icon: string | IconProps;
    children?: ReactNode;
}

const ToolbarButton = React.forwardRef<HTMLButtonElement, Props>(
    ({ icon, children, className, disabled, tabIndex, onClick, ...rest }: Props, ref) => {
        return (
            <button
                type="button"
                className={classnames([className, 'toolbar-button'])}
                onClick={disabled ? noop : onClick}
                tabIndex={disabled ? -1 : tabIndex}
                disabled={disabled}
                ref={ref}
                {...rest}
            >
                {typeof icon === 'string' ? (
                    <Icon name={icon} className="toolbar-icon mauto" />
                ) : (
                    <Icon {...icon} className={classnames([icon.className, 'toolbar-icon mauto'])} />
                )}
                {children}
            </button>
        );
    }
);

export default ToolbarButton;
