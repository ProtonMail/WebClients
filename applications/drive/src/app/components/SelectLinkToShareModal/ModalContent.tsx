import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Alert, ModalTwoContent, ModalTwoFooter, ModalTwoHeader, PrimaryButton } from '@proton/components';

import { DecryptedLink, TreeItem } from '../../store';
import FolderTree from '../FolderTree/FolderTree';
import EmptyFileTreePlaceholder from './EmptyFileTreePlaceholder';

export const ModalContent = ({
    rootItems,
    isLoading,
    isSharingDisabled,
    actionText,
    toggleExpand,
    onSelect,
    selectedLinkId,
}: {
    rootItems: TreeItem[];
    isLoading: boolean;
    isTreeLoaded: boolean;
    selectedLinkId: string | undefined;
    isSharingDisabled: boolean;
    actionText: string;
    toggleExpand: (linkId: string) => void;
    onSelect: (link: DecryptedLink) => void;
}) => {
    if (rootItems.length === 0) {
        return (
            <>
                <ModalTwoHeader closeButtonProps={{ disabled: isLoading }} />
                <EmptyFileTreePlaceholder />
            </>
        );
    }

    return (
        <>
            <ModalTwoHeader title={c('Action').t`Share item`} closeButtonProps={{ disabled: isLoading }} />
            <ModalTwoContent>
                <Alert className="mb1">{c('Info').t`Select an uploaded file or folder and create a link to it.`}</Alert>
                <FolderTree
                    treeItems={rootItems}
                    isLoaded={true}
                    selectedItemId={selectedLinkId}
                    onSelect={onSelect}
                    toggleExpand={toggleExpand}
                />
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button type="reset" className="w8e" disabled={isLoading}>
                    {c('Action').t`Cancel`}
                </Button>
                <PrimaryButton className="ml1 w8e" loading={isLoading} type="submit" disabled={isSharingDisabled}>
                    {actionText}
                </PrimaryButton>
            </ModalTwoFooter>
        </>
    );
};
