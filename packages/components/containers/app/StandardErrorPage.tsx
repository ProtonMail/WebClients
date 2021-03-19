import React from 'react';
import { c } from 'ttag';
import GenericError from '../error/GenericError';
import { ProminentContainer } from '../../components';
import { useDocumentTitle } from '../../hooks';

const StandardLoadError = () => {
    useDocumentTitle(c('Error message').t`Oops, something went wrong`);

    return (
        <ProminentContainer>
            <GenericError />
        </ProminentContainer>
    );
};

export default StandardLoadError;
