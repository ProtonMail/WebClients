import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Alert, ModalTwoContent, ModalTwoFooter, ModalTwoHeader } from '@proton/components';

interface Props {
    error: string;
    isCreationError: boolean;
    onClose?: () => void;
}

function ErrorState({ error, isCreationError, onClose }: Props) {
    return (
        <>
            <ModalTwoHeader title={c('Title').t`Manage secure link`} />
            <ModalTwoContent>
                <Alert className="mb1" type="error">
                    {isCreationError
                        ? c('Info').t`Failed to generate a secure link. Try again later.`
                        : c('Info').t`Failed to open a secure link. The reason is: ${error}`}
                </Alert>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button onClick={onClose}>{c('Action').t`Done`}</Button>
            </ModalTwoFooter>
        </>
    );
}

export default ErrorState;
