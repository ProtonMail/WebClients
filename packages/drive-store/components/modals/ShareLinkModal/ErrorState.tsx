import type { PropsWithChildren } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Alert, ModalTwoContent, ModalTwoFooter, ModalTwoHeader } from '@proton/components';

interface Props {
    onClose?: () => void;
}

function ErrorState({ children, onClose }: PropsWithChildren<Props>) {
    return (
        <>
            <ModalTwoHeader title={c('Title').t`Manage secure link`} />
            <ModalTwoContent>
                <Alert className="mb-4" type="error">
                    {children}
                </Alert>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button onClick={onClose}>{c('Action').t`Done`}</Button>
            </ModalTwoFooter>
        </>
    );
}

export default ErrorState;
