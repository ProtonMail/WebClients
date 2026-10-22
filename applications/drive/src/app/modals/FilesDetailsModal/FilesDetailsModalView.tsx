import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import Alert from '@proton/components/components/alert/Alert';
import Field from '@proton/components/components/container/Field';
import Row from '@proton/components/components/container/Row';
import Label from '@proton/components/components/label/Label';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState';
import ModalContentLoader from '@proton/drive/modals/modalUtils/ModalContentLoader';
import humanSize from '@proton/shared/lib/helpers/humanSize';

export type FilesDetailsModalViewProps = ModalStateProps & {
    isLoading: boolean;
    hasError: boolean;
    count: number;
    size: number;
};

export function FilesDetailsModalView({
    onClose,
    open,
    onExit,
    isLoading,
    hasError,
    count,
    size,
}: FilesDetailsModalViewProps) {
    const title = c('Title').t`Item details`;

    const renderModalState = () => {
        if (isLoading) {
            return <ModalContentLoader>{c('Info').t`Loading links`}</ModalContentLoader>;
        }

        if (hasError) {
            return (
                <ModalTwoContent>
                    <Alert type="error">{c('Info').t`Cannot load links`}</Alert>
                </ModalTwoContent>
            );
        }

        return (
            <ModalTwoContent>
                <Row>
                    <Label style={{ cursor: 'default' }}>{c('Title').t`Number of items`}</Label>
                    <Field className="pt-2">
                        <b data-testid="number-of-items">{count}</b>
                    </Field>
                </Row>
                <Row>
                    <Label style={{ cursor: 'default' }}>{c('Title').t`Total size`}</Label>
                    <Field className="pt-2">
                        <b>{humanSize({ bytes: size })}</b>
                    </Field>
                </Row>
            </ModalTwoContent>
        );
    };

    return (
        <ModalTwo onClose={onClose} size="large" open={open} onExit={onExit}>
            <ModalTwoHeader title={title} />
            {renderModalState()}
            <ModalTwoFooter>
                <Button onClick={onClose}>{c('Action').t`Close`}</Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
}
