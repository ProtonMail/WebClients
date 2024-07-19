import { c } from 'ttag';

import { Button } from '@proton/atoms';
import {
    Alert,
    Icon,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    PrimaryButton,
    UnderlineButton,
} from '@proton/components';

import type { DecryptedLink, TreeItem } from '../../../store';
import FolderTree from '../../FolderTree/FolderTree';
import EmptyFileTreePlaceholder from './EmptyFileTreePlaceholder';

export const ModalContent = ({
    rootItems,
    isLoading,
    isMoveDisabled,
    toggleExpand,
    selectedLinkId,
    onSelect,
    title,
    isSmallViewport,
    onCreate,
}: {
    rootItems: TreeItem[];
    isLoading: boolean;
    isTreeLoaded: boolean;
    isMoveDisabled: boolean;
    toggleExpand: (linkId: string) => void;
    onSelect: (link: DecryptedLink) => void;
    title: string;
    isSmallViewport: boolean;
    selectedLinkId: string | undefined;
    onCreate: (selectedFolder?: string) => void;
}) => {
    if (rootItems.length === 0) {
        return (
            <>
                <ModalTwoHeader closeButtonProps={{ disabled: isLoading }} />
                <EmptyFileTreePlaceholder onCreate={() => onCreate(selectedLinkId)} />
            </>
        );
    }

    return (
        <>
            <ModalTwoHeader title={title} closeButtonProps={{ disabled: isLoading }} />
            <ModalTwoContent>
                <Alert className="mb-4">{c('Info').t`Select a folder to move to.`}</Alert>
                <FolderTree
                    treeItems={rootItems}
                    isLoaded={true}
                    selectedItemId={selectedLinkId}
                    onSelect={onSelect}
                    toggleExpand={toggleExpand}
                />
            </ModalTwoContent>
            <ModalTwoFooter>
                <div className="flex justify-space-between w-full flex-nowrap">
                    {isSmallViewport ? (
                        <Button
                            icon
                            disabled={isLoading || !selectedLinkId}
                            onClick={() => onCreate(selectedLinkId)}
                            title={c('Action').t`Create new folder`}
                        >
                            <Icon name="folder-plus" />
                        </Button>
                    ) : (
                        <UnderlineButton
                            disabled={isLoading || !selectedLinkId}
                            onClick={() => onCreate(selectedLinkId)}
                        >
                            {c('Action').t`Create new folder`}
                        </UnderlineButton>
                    )}
                    <div>
                        <Button type="reset" disabled={isLoading} autoFocus>
                            {c('Action').t`Close`}
                        </Button>
                        <PrimaryButton className="ml-4" loading={isLoading} type="submit" disabled={isMoveDisabled}>
                            {c('Action').t`Move`}
                        </PrimaryButton>
                    </div>
                </div>
            </ModalTwoFooter>
        </>
    );
};
