import { ReactNode } from 'react';

import { c } from 'ttag';

import { FormModal } from '../../components';
import { GenericError } from '../error';
import ErrorBoundary from './ErrorBoundary';

interface Props {
    children?: ReactNode;
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
