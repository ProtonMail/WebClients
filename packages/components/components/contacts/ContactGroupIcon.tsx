import React from 'react';

import Tooltip from '../tooltip/Tooltip';
import Icon from '../icon/Icon';

interface Props {
    name: string;
    color: string;
}

const ContactGroupIcon = ({ name, color, ...rest }: Props) => {
    return (
        <Tooltip title={name} {...rest}>
            <Icon name="contacts-groups" color={color} />
        </Tooltip>
    );
};

export default ContactGroupIcon;
