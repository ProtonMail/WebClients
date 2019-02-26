import React, { useContext } from 'react';
import { c } from 'ttag';
import { SubTitle, Alert } from 'react-components';

const ThemesSection = () => {
    return (
        <>
            <SubTitle>{c('Title').t`Themes`}</SubTitle>
            <Alert>{c('Info').t`Lorem ipsum`}</Alert>
        </>
    );
};

export default ThemesSection;