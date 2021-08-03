import * as React from 'react';
import { c } from 'ttag';
import { FormModal } from '../../components';
import ErrorBoundary from './ErrorBoundary';
import { GenericError } from '../error';

interface Props {
    children?: React.ReactNode;
    onClose?: () => void;
}

const ModalErrorBoundary = ({ children, ...rest }: Props) => {
    const errorComponent = (
        <FormModal close={null} onSubmit={rest?.onClose} submit={c('Action').t`Close`} {...rest}>
            <GenericError />
        </FormModal>
    );
    return <ErrorBoundary component={errorComponent}>{children}</ErrorBoundary>;
};

export default ModalErrorBoundary;
