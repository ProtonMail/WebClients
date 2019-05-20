import React from 'react';
import { c } from 'ttag';
import { SubTitle, Alert } from 'react-components';

const ProtonMailBetaSection = () => {
    return (
        <>
            <SubTitle>ProtonMail Beta</SubTitle>
            <Alert learnMore="https://protonmail.com/blog/how-to-become-protonmail-beta-tester/">{c('Info')
                .t`Participating in beta programs gives you the opportunity to test new features and improvements before they get released to the general public. It offers a chance to have an active role in shaping the quality of our services.`}</Alert>
        </>
    );
};

export default ProtonMailBetaSection;
