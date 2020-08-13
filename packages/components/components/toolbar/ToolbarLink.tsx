import React from 'react';
import { Link, LinkProps } from 'react-router-dom';
import { classnames } from '../../helpers';
import Icon, { Props as IconProps } from '../icon/Icon';

interface Props<S> extends LinkProps<S> {
    icon: string | IconProps;
}

function ToolbarLink<S>({ icon, className, ...rest }: Props<S>) {
    return (
        <Link className={classnames([className, 'toolbar-button'])} {...rest}>
            {typeof icon === 'string' ? (
                <Icon name={icon} className="toolbar-icon mauto" />
            ) : (
                <Icon {...icon} className={classnames([icon.className, 'toolbar-icon mauto'])} />
            )}
        </Link>
    );
}

export default ToolbarLink;
