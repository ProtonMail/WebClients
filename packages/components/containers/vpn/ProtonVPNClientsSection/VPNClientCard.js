import React from 'react';
import PropTypes from 'prop-types';
import { Bordered, Icon, Button, Block, Href } from 'react-components';
import { c } from 'ttag';

const VPNClientCard = ({ title, link, icon }) => {
    return (
        <Bordered className="ml0-5 mr0-5 aligncenter">
            <div>
                <Icon size={25} name={icon} />
            </div>
            <Block>{title}</Block>
            <Href url={link}>
                <Button>{c('Action').t`Download`}</Button>
            </Href>
        </Bordered>
    );
};

VPNClientCard.propTypes = {
    title: PropTypes.string.isRequired,
    link: PropTypes.string.isRequired,
    icon: PropTypes.string.isRequired
};

export default VPNClientCard;
