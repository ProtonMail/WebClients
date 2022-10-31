import { ReactNode, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import {
    Alert,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    PrimaryButton,
    useLoading,
} from '@proton/components';

import { DecryptedLink, useFolderTreeModals } from '../../store';
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
    const { rootItems, toggleExpand, isLoaded: isTreeLoaded } = useFolderTreeModals(shareId, { rootExpanded: true });

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
        content: rootItems && rootItems.length && (
            <>
                <Alert className="mb1">{c('Info').t`Select an uploaded file or folder and create a link to it.`}</Alert>
                <FolderTree
                    treeItems={rootItems}
                    isLoaded={isTreeLoaded}
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

    if (rootItems && isTreeLoaded && rootItems.length === 0) {
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
            {!rootItems.length || !isTreeLoaded ? (
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
