import { ReactNode } from 'react';
import { c } from 'ttag';
import GenericError from '../error/GenericError';
import { useDocumentTitle } from '../../hooks';

interface Props {
    children?: ReactNode;
}

const StandardErrorPage = ({ children }: Props) => {
    useDocumentTitle(c('Error message').t`Oops, something went wrong`);

    return (
        <div className="h100 flex flex-align-items-center pb4 scroll-if-needed">
            <GenericError>{children}</GenericError>
        </div>
    );
};

export default StandardErrorPage;
