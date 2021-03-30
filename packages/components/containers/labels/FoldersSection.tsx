import React from 'react';
import { c } from 'ttag';

import { Loader, Alert, PrimaryButton, Label, Row, Field, Info } from '../../components';
import { useFolders, useMailSettings, useModals } from '../../hooks';
import FolderTreeViewList from './FolderTreeViewList';
import EditLabelModal from './modals/EditLabelModal';
import ToggleEnableFolderColor from './ToggleEnableFolderColor';
import ToggleInheritParentFolderColor from './ToggleInheritParentFolderColor';

function LabelsSection() {
    const [folders, loadingFolders] = useFolders();
    const { createModal } = useModals();
    const [mailSettings] = useMailSettings();

    if (loadingFolders) {
        return <Loader />;
    }

    return (
        <>
            <Alert
                type="info"
                className="mt1 mb1"
                learnMore="https://protonmail.com/support/knowledge-base/creating-folders/"
            >
                {c('LabelSettings').t`A message can only be filed in a single Folder at a time.`}
            </Alert>
            <Row>
                <Label htmlFor="folder-colors">{c('Label').t`Use folder colors`}</Label>
                <Field className="pt0-5">
                    <ToggleEnableFolderColor id="folder-colors" />
                </Field>
            </Row>
            {mailSettings?.EnableFolderColor ? (
                <Row>
                    <Label htmlFor="parent-folder-color">
                        <span>{c('Label').t`Inherit color from parent folder`}</span>
                        <Info
                            buttonClass="ml0-5 inline-flex"
                            title={c('Info - folder colouring feature')
                                .t`When enabled, sub-folders inherit the color of the parent folder.`}
                        />
                    </Label>
                    <Field className="pt0-5">
                        <ToggleInheritParentFolderColor id="parent-folder-color" />
                    </Field>
                </Row>
            ) : null}
            <div className="mb1">
                <PrimaryButton onClick={() => createModal(<EditLabelModal type="folder" />)}>
                    {c('Action').t`Add folder`}
                </PrimaryButton>
            </div>
            {folders?.length ? (
                <FolderTreeViewList items={folders} />
            ) : (
                <Alert>{c('LabelSettings').t`No folders available`}</Alert>
            )}
        </>
    );
}

export default LabelsSection;
