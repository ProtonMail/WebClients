import React from 'react';
import PropTypes from 'prop-types';
import { Bordered, Icon, Button, Block } from 'react-components';
import { c } from 'ttag';

const VPNClientCard = ({ title, link, icon }) => {
    return (
        <div className="aligncenter flex-autogrid-item">
            <Bordered>
                <div>
                    <Icon size={25} name={icon} />
                </div>
                <Block>{title}</Block>
                <a href={link}>
                    <Button>{c('Action').t`Download`}</Button>
                </a>
            </Bordered>
        </div>
    );
};

VPNClientCard.propTypes = {
    title: PropTypes.string.isRequired,
    link: PropTypes.string.isRequired,
    icon: PropTypes.string.isRequired
};

export default VPNClientCard;
