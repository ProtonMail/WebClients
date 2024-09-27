import type { ReactNode } from 'react';

import { c } from 'ttag';

import FormModal from '@proton/components/components/modal/FormModal';

import GenericError from '../error/GenericError';
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
