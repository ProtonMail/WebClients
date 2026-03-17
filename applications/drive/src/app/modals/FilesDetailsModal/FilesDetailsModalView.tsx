import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import type { ModalStateProps } from '@proton/components';
import {
    Alert,
    Field,
    Label,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    Row,
} from '@proton/components';
import humanSize from '@proton/shared/lib/helpers/humanSize';

import ModalContentLoader from '../../components/modals/ModalContentLoader';

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
