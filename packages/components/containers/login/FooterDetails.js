import React, { useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';

const FooterDetails = ({ link }) => {
    const yearRef = useRef();

    useEffect(() => {
        yearRef.current = new Date().getFullYear();
    }, []);

    return c('Footer').jt`${yearRef.current} ${React.cloneElement(link, {
        key: 'static-link'
    })} - Made globally, hosted in Switzerland.`;
};

FooterDetails.propTypes = {
    link: PropTypes.node.isRequired
};

export default FooterDetails;
