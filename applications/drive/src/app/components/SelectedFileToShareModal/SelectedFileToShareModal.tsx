import { ReactNode, useState } from 'react';

import { c } from 'ttag';

import {
    Alert,
    Button,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    PrimaryButton,
    useLoading,
} from '@proton/components';

import { DecryptedLink, useTree } from '../../store';
import FolderTree from '../FolderTree/FolderTree';
import ModalContentLoader from '../ModalContentLoader';
import useOpenModal from '../useOpenModal';
import HasNoFilesToShare from './HasNoFilesToShare';

interface Props {
    shareId: string;
    onClose?: () => void;
    open?: boolean;
}

const SelectedFileToShareModal = ({ shareId, onClose, open }: Props) => {
    const { rootFolder, toggleExpand } = useTree(shareId, { rootExpanded: true });

    const [loading, withLoading] = useLoading();
    const [selectedFile, setSelectedFile] = useState<DecryptedLink>();
    const { openLinkSharing } = useOpenModal();

    const onSelect = async (link: DecryptedLink) => {
        if (!loading) {
            setSelectedFile(link);
        }
    };

    const handleSubmit = async () => {
        if (selectedFile) {
            openLinkSharing(shareId, selectedFile.linkId);
            onClose?.();
        }
    };

    const shareIsDisabled = !selectedFile || !selectedFile.parentLinkId;

    let modalContents = {
        title: c('Action').t`Share item`,
        content: rootFolder && (
            <>
                <Alert className="mb1">{c('Info').t`Select an uploaded file or folder and create a link to it.`}</Alert>
                <FolderTree
                    rootFolder={rootFolder}
                    selectedItemId={selectedFile?.linkId}
                    onSelect={onSelect}
                    toggleExpand={toggleExpand}
                />
            </>
        ),
        footer: (
            <ModalTwoFooter>
                <Button type="reset" className="w8e" disabled={loading}>
                    {c('Action').t`Cancel`}
                </Button>
                <PrimaryButton className="ml1 w8e" loading={loading} type="submit" disabled={shareIsDisabled}>
                    {selectedFile?.shareUrl ? c('Action').t`Manage link` : c('Action').t`Create link`}
                </PrimaryButton>
            </ModalTwoFooter>
        ) as ReactNode,
    };

    if (rootFolder && rootFolder.isLoaded && rootFolder.children.length === 0) {
        modalContents = {
            content: <HasNoFilesToShare />,
            title: '',
            footer: null,
        };
    }

    return (
        <ModalTwo
            open={open}
            onReset={onClose}
            onClose={onClose}
            onSubmit={(e: any) => {
                e.preventDefault();
                withLoading(handleSubmit()).catch(console.error);
            }}
            size="large"
            as="form"
        >
            <ModalTwoHeader title={modalContents.title} closeButtonProps={{ disabled: loading }} />
            {!rootFolder || !rootFolder.isLoaded ? (
                <ModalContentLoader>{c('Info').t`Loading`}</ModalContentLoader>
            ) : (
                <>
                    <ModalTwoContent>{modalContents.content}</ModalTwoContent>
                    {modalContents.footer}
                </>
            )}
        </ModalTwo>
    );
};

export default SelectedFileToShareModal;
