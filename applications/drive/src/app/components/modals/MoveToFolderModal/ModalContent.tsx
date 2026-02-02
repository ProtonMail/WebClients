import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Alert, ModalTwoContent, ModalTwoFooter, ModalTwoHeader } from '@proton/components';
import { IcFolderPlus } from '@proton/icons/icons/IcFolderPlus';

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
                            <IcFolderPlus alt={c('Action').t`Create new folder`} />
                        </Button>
                    ) : (
                        <Button
                            shape="underline"
                            color="norm"
                            disabled={isLoading || !selectedLinkId}
                            onClick={() => onCreate(selectedLinkId)}
                        >
                            {c('Action').t`Create new folder`}
                        </Button>
                    )}
                    <div>
                        <Button type="reset" disabled={isLoading} autoFocus>
                            {c('Action').t`Close`}
                        </Button>
                        <Button
                            color="norm"
                            className="ml-4"
                            loading={isLoading}
                            type="submit"
                            disabled={isMoveDisabled}
                        >
                            {c('Action').t`Move`}
                        </Button>
                    </div>
                </div>
            </ModalTwoFooter>
        </>
    );
};
