import { ReactNode } from 'react';

import { c } from 'ttag';

import { BRAND_NAME } from '@proton/shared/lib/constants';

interface Props {
    link?: ReactNode;
}
const FooterDetails = ({ link }: Props) => {
    const currentYear = new Date().getFullYear();
    return (
        <>
            {currentYear} {link} -{' '}
            {
                // translator: full sentence 'Proton. Privacy by default.'
                c('Footer').t`${BRAND_NAME}. Privacy by default.`
            }
        </>
    );
};

export default FooterDetails;
