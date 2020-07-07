import React from 'react';
import { c } from 'ttag';

interface Props {
    link?: React.ReactNode;
}
const FooterDetails = ({ link }: Props) => {
    const currentYear = new Date().getFullYear();
    return (
        <>
            {currentYear} {link} - {c('Footer').t`Made globally, hosted in Switzerland.`}
        </>
    );
};

export default FooterDetails;
