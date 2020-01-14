import React, { HTMLAttributes } from 'react';
import { Link } from 'react-router-dom';
import { classnames } from '../../helpers/component';
import Icon, { Props as IconProps } from '../icon/Icon';

interface Props extends HTMLAttributes<HTMLButtonElement> {
    to: string;
    icon: string | IconProps;
}

const ToolbarLink = ({ to, icon, className, ...rest }: Props) => {
    return (
        <Link to={to} className={classnames([className, 'toolbar-button'])} {...rest}>
            {typeof icon === 'string' ? (
                <Icon name={icon} className="toolbar-icon mauto" />
            ) : (
                <Icon {...icon} className={classnames([icon.className, 'toolbar-icon mauto'])} />
            )}
        </Link>
    );
};

export default ToolbarLink;
