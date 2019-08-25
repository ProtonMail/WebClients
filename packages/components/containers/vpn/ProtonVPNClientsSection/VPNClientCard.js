import React from 'react';
import PropTypes from 'prop-types';
import { Bordered, Icon, Block, Href } from 'react-components';
import { c } from 'ttag';

const VPNClientCard = ({ title, link, icon }) => {
    return (
        <Bordered className="ml0-5 mr0-5 aligncenter relative">
            <div>
                <Icon size={25} name={icon} />
            </div>
            <Block>{title}</Block>
            <Href url={link} className="pm-button increase-surface-click">
                {c('Action').t`Download`}
                <span className="sr-only">{title}</span>
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
