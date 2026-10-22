import React from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import Alert from '@proton/components/components/alert/Alert';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import type { DirectoryTreeItem } from '@proton/drive/components/DirectoryTree/DirectoryTree';
import { DirectoryTreeRoot } from '@proton/drive/components/DirectoryTree/DirectoryTree';
import ModalContentLoader from '@proton/drive/modals/modalUtils/ModalContentLoader';
import useLoading from '@proton/hooks/useLoading';

export type SelectLinkToShareModalViewProps =
    ({ loaded: true } & LoadedSelectLinkToShareModalViewProps) | { loaded: false };

type LoadedSelectLinkToShareModalViewProps = {
    open: boolean;
    onExit: () => void;
    treeRoots: React.ComponentProps<typeof DirectoryTreeRoot>['roots'];
    toggleExpand: React.ComponentProps<typeof DirectoryTreeRoot>['toggleExpand'];
    selectedTreeId: string | undefined;
    selectedNodeUid: string | undefined;
    handleSelect: (treeItemId: string, item: DirectoryTreeItem) => void;
    handleSubmit: () => Promise<void>;
    onClose: () => void;
};

const SelectLinkToShareModalContent = ({
    open,
    onExit,
    treeRoots,
    toggleExpand,
    selectedTreeId,
    selectedNodeUid,
    handleSelect,
    handleSubmit,
    onClose,
}: LoadedSelectLinkToShareModalViewProps) => {
    const [loading, withLoading] = useLoading();
    const isSharingDisabled = !selectedNodeUid;

    return (
        <ModalTwo
            open={open}
            onExit={onExit}
            onClose={onClose}
            size="large"
            as="form"
            onSubmit={(e: React.FormEvent) => {
                e.preventDefault();
                withLoading(handleSubmit()).catch(console.error);
            }}
            onReset={onClose}
        >
            <ModalTwoHeader title={c('Action').t`Share item`} closeButtonProps={{ disabled: loading }} />
            <ModalTwoContent>
                <Alert className="mb-4">
                    {c('Info').t`Select an uploaded file or folder and create a link to it.`}
                </Alert>
                <DirectoryTreeRoot
                    roots={treeRoots}
                    toggleExpand={toggleExpand}
                    selectedTreeId={selectedTreeId}
                    onSelect={handleSelect}
                />
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button type="reset" disabled={loading}>
                    {c('Action').t`Cancel`}
                </Button>
                <Button color="norm" className="ml-4" loading={loading} type="submit" disabled={isSharingDisabled}>
                    {c('Action').t`Share`}
                </Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export const SelectLinkToShareModalView: React.FC<SelectLinkToShareModalViewProps & ModalProps> = (props) => {
    if (!props.loaded) {
        return (
            <ModalTwo as="form" open={true} size="large">
                <ModalTwoContent>
                    <ModalContentLoader>{c('Info').t`Loading`}</ModalContentLoader>
                </ModalTwoContent>
            </ModalTwo>
        );
    }
    return <SelectLinkToShareModalContent {...props} />;
};
