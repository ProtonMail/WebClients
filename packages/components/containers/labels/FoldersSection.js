import React from 'react';
import { c } from 'ttag';
import { Loader, SubTitle, Alert, PrimaryButton, useFolders, useModals } from 'react-components';

import FolderTreeViewList from './FolderTreeViewList';
import EditLabelModal from './modals/Edit';

function LabelsSection() {
    const [folders, loadingFolders] = useFolders();
    const { createModal } = useModals();

    if (loadingFolders) {
        return (
            <>
                <SubTitle>{c('LabelSettings').t`Folders`}</SubTitle>
                <Loader />
            </>
        );
    }

    return (
        <>
            <SubTitle>{c('LabelSettings').t`Folders`}</SubTitle>
            <Alert
                type="info"
                className="mt1 mb1"
                learnMore="https://protonmail.com/support/knowledge-base/creating-folders/"
            >
                {c('LabelSettings').t`A message can only be in filed in a single Folder at a time.`}
            </Alert>
            <div className="mb1">
                <PrimaryButton onClick={() => createModal(<EditLabelModal type="folder" />)}>
                    {c('Action').t`Add folder`}
                </PrimaryButton>
            </div>
            {folders.length ? (
                <FolderTreeViewList items={folders} />
            ) : (
                <Alert>{c('LabelSettings').t`No folders available`}</Alert>
            )}
        </>
    );
}

export default LabelsSection;
