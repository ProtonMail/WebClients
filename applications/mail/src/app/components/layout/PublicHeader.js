import React from 'react';
import PropTypes from 'prop-types';
import { Href, MainLogo } from 'react-components';
import { c } from 'ttag';

const PublicHeader = ({ action }) => (
    <header className="flex-item-noshrink flex flex-items-center noprint mb2">
        <div className="nomobile flex-item-fluid">
            <span className="opacity-50">{c('Label').t`Back to:`}</span>{' '}
            <Href
                url="https://protonmail.com"
                className="inbl color-white nodecoration hover-same-color"
                target="_self"
            >{c('Link').t`protonmail.com`}</Href>
        </div>
        <div className="w150p center">
            <Href url="https://protonmail.com" target="_self">
                <MainLogo className="fill-primary" />
            </Href>
        </div>
        <div className="nomobile flex-item-fluid alignright">{action}</div>
    </header>
);

PublicHeader.propTypes = {
    action: PropTypes.node
};

export default PublicHeader;
