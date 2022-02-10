import { useState, ReactNode } from 'react';
import { c } from 'ttag';

import {
    useLoading,
    PrimaryButton,
    DialogModal,
    HeaderModal,
    ContentModal,
    InnerModal,
    FooterModal,
    Button,
    Alert,
} from '@proton/components';
import { FileBrowserItem } from '@proton/shared/lib/interfaces/drive/fileBrowser';

import { DecryptedLink, useTree } from '../../store';
import useOpenModal from '../useOpenModal';
import FolderTree from '../FolderTree/FolderTree';
import { mapDecryptedLinksToChildren } from '../sections/helpers';
import HasNoFilesToShare from './HasNoFilesToShare';
import ModalContentLoader from '../ModalContentLoader';

interface Props {
    shareId: string;
    onClose?: () => void;
}

const SelectedFileToShareModal = ({ shareId, onClose, ...rest }: Props) => {
    const { rootFolder, toggleExpand } = useTree(shareId, { rootExpanded: true });

    const [loading, withLoading] = useLoading();
    const [selectedFile, setSelectedFile] = useState<FileBrowserItem>();
    const { openLinkSharing } = useOpenModal();

    const onSelect = async (link: DecryptedLink) => {
        if (!loading) {
            setSelectedFile(mapDecryptedLinksToChildren([link])[0]);
        }
    };

    const handleSubmit = async () => {
        if (selectedFile) {
            openLinkSharing(shareId, selectedFile);
            onClose?.();
        }
    };

    const modalTitleID = 'SelectFileToShareId';
    const shareIsDisabled = !selectedFile || !selectedFile.ParentLinkID;

    let modalContents = {
        title: c('Action').t`Share item`,
        content: rootFolder && (
            <>
                <Alert className="mb1">{c('Info').t`Select an uploaded file or folder and create a link to it.`}</Alert>
                <FolderTree
                    rootFolder={rootFolder}
                    selectedItemId={selectedFile?.LinkID}
                    onSelect={onSelect}
                    toggleExpand={toggleExpand}
                />
            </>
        ),
        footer: (
            <FooterModal>
                <div className="flex flex-justify-space-between w100 flex-nowrap">
                    <Button type="reset" className="w8e" disabled={loading} autoFocus>
                        {c('Action').t`Cancel`}
                    </Button>
                    <PrimaryButton className="ml1 w8e" loading={loading} type="submit" disabled={shareIsDisabled}>
                        {selectedFile?.SharedUrl ? c('Action').t`Manage link` : c('Action').t`Create link`}
                    </PrimaryButton>
                </div>
            </FooterModal>
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
        <DialogModal modalTitleID={modalTitleID} onClose={onClose} {...rest}>
            <HeaderModal modalTitleID={modalTitleID} hasClose={!loading} onClose={onClose}>
                {modalContents.title}
            </HeaderModal>
            {!rootFolder || !rootFolder.isLoaded ? (
                <ModalContentLoader>{c('Info').t`Loading`}</ModalContentLoader>
            ) : (
                <ContentModal
                    onSubmit={() => {
                        withLoading(handleSubmit()).catch(console.error);
                    }}
                    onReset={() => {
                        onClose?.();
                    }}
                >
                    <InnerModal>{modalContents.content}</InnerModal>
                    {modalContents.footer}
                </ContentModal>
            )}
        </DialogModal>
    );
};

export default SelectedFileToShareModal;
