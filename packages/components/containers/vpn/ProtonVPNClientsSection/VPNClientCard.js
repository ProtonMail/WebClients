import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { Bordered, Icon, Block, Href } from '../../../components';

const VPNClientCard = ({ title, link, icon }) => {
    return (
        <Bordered className="mr1 aligncenter relative">
            <div>
                <Icon size={24} name={icon} />
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
    icon: PropTypes.string.isRequired,
};

export default VPNClientCard;
