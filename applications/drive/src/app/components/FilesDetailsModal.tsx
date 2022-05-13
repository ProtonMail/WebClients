import { c } from 'ttag';

import {
    Alert,
    Row,
    Label,
    Field,
    ModalTwo,
    Button,
    ModalTwoHeader,
    ModalTwoContent,
    ModalTwoFooter,
} from '@proton/components';

import { useLinksDetailsView } from '../store';
import ModalContentLoader from './ModalContentLoader';
import SizeCell from './FileBrowser/ListView/Cells/SizeCell';

interface Props {
    shareId: string;
    linkIds: string[];
    onClose?: () => void;
    open?: boolean;
}

const FilesDetailsModal = ({ shareId, linkIds, onClose, open }: Props) => {
    const { isLoading, error, hasFile, hasFolder, count, size } = useLinksDetailsView(shareId, linkIds);

    let title = c('Title').t`Items details`;
    let labelCount = c('Title').t`Number of items`;
    if (!hasFile || !hasFolder) {
        title = hasFile ? c('Title').t`Files details` : c('Title').t`Folders details`;
        labelCount = hasFile ? c('Title').t`Number of files` : c('Title').t`Number of folders`;
    }

    const renderModalState = () => {
        if (isLoading) {
            return <ModalContentLoader>{c('Info').t`Loading links`}</ModalContentLoader>;
        }

        if (error) {
            return (
                <ModalTwoContent>
                    <Alert type="error">{c('Info').t`Links failed to be loaded`}</Alert>
                </ModalTwoContent>
            );
        }

        return (
            <ModalTwoContent>
                <Row>
                    <Label style={{ cursor: 'default' }}>{labelCount}</Label>
                    <Field className="pt0-5">
                        <b>{count}</b>
                    </Field>
                </Row>
                <Row>
                    <Label style={{ cursor: 'default' }}>{c('Title').t`Total size`}</Label>
                    <Field className="pt0-5">
                        <b>
                            <SizeCell size={size} />
                        </b>
                    </Field>
                </Row>
            </ModalTwoContent>
        );
    };

    return (
        <ModalTwo onClose={onClose} open={open} size="large">
            <ModalTwoHeader title={title} />
            {renderModalState()}
            <ModalTwoFooter>
                <Button onClick={onClose}>{c('Action').t`Close`}</Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default FilesDetailsModal;
