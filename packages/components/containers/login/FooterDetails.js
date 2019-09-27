import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';

const FooterDetails = ({ link }) => {
    const currentYear = new Date().getFullYear();

    return (
        <>
            {currentYear} {link} - {c('Footer').t`Made globally, hosted in Switzerland.`}
        </>
    );
};

FooterDetails.propTypes = {
    link: PropTypes.node.isRequired
};

export default FooterDetails;
