import React, { ReactNode } from 'react';
import { c } from 'ttag';
import GenericError from '../error/GenericError';
import { ProminentContainer } from '../../components';
import { useDocumentTitle } from '../../hooks';

interface Props {
    children?: ReactNode;
}

const StandardErrorPage = ({ children }: Props) => {
    useDocumentTitle(c('Error message').t`Oops, something went wrong`);

    return (
        <ProminentContainer className="flex flex-align-items-center pb4 scroll-if-needed">
            <GenericError>{children}</GenericError>
        </ProminentContainer>
    );
};

export default StandardErrorPage;
