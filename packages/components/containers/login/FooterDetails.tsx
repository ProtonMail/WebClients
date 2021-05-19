import React from 'react';
import { c } from 'ttag';

interface Props {
    link?: React.ReactNode;
}
const FooterDetails = ({ link }: Props) => {
    const currentYear = new Date().getFullYear();
    return (
        <>
            {currentYear} {link} - {c('Footer').t`Based in Switzerland, available globally.`}
        </>
    );
};

export default FooterDetails;
