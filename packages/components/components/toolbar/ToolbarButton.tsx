import React, { HTMLAttributes } from 'react';
import { classnames } from '../../helpers/component';
import Icon, { Props as IconProps } from '../icon/Icon';

interface Props extends HTMLAttributes<HTMLButtonElement> {
    icon: string | IconProps;
}

const ToolbarButton = ({ icon, className, ...rest }: Props) => {
    return (
        <button type="button" className={classnames([className, 'toolbar-button'])} {...rest}>
            {typeof icon === 'string' ? (
                <Icon name={icon} className="toolbar-icon mauto" />
            ) : (
                <Icon {...icon} className={classnames([icon.className, 'toolbar-icon mauto'])} />
            )}
        </button>
    );
};

export default ToolbarButton;
