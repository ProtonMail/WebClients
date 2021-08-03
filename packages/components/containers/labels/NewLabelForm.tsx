import React from 'react';
import { c } from 'ttag';

import { LABEL_TYPE } from '@proton/shared/lib/constants';
import { Label as tsLabel } from '@proton/shared/lib/interfaces/Label';
import { Folder } from '@proton/shared/lib/interfaces/Folder';

import { Alert, Input, Label, Row, Field, ColorPicker, Toggle, Info } from '../../components';

import ParentFolderSelector from './ParentFolderSelector';
import { useMailSettings } from '../../hooks';

interface Props {
    label: Partial<tsLabel | Folder>;
    onChangeName: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onChangeColor: (color: string) => void;
    onChangeParentID?: (parentID: string | number) => void;
    onChangeNotify?: (value: number) => void;
}

function NewLabelForm({ label: labelOrFolder, onChangeColor, onChangeName, onChangeParentID, onChangeNotify }: Props) {
    const [mailSettings] = useMailSettings();

    const labelRenderer = () => {
        const label = labelOrFolder as tsLabel;
        return (
            <Row>
                <Label htmlFor="accountType">{c('New Label form').t`Color`} </Label>
                <Field>
                    <ColorPicker color={label.Color} onChange={onChangeColor} />
                </Field>
            </Row>
        );
    };

    const folderRenderer = () => {
        const folder = labelOrFolder as Folder;

        return (
            <>
                <Row>
                    <Label htmlFor="parentID">{c('Label').t`Folder location`}</Label>
                    <Field>
                        <ParentFolderSelector
                            id="parentID"
                            value={folder.ParentID || 0}
                            onChange={onChangeParentID}
                            disableOptions={[folder.ID]}
                        />
                    </Field>
                </Row>
                {mailSettings?.EnableFolderColor ? (
                    <Row>
                        <Label htmlFor="accountType">{c('New Label form').t`Color`} </Label>
                        <Field>
                            {mailSettings?.InheritParentFolderColor && folder.ParentID ? (
                                <div className="mt0-5">{c('Info').t`Inherited from parent folder`}</div>
                            ) : (
                                <ColorPicker color={folder.Color} onChange={onChangeColor} />
                            )}
                        </Field>
                    </Row>
                ) : null}
                <Row>
                    <Label htmlFor="notification">
                        <span className="mr0-5">{c('Label').t`Notification`}</span>
                        <Info
                            title={c('Info')
                                .t`You can turn on notifications to get alerts when new email messages arrive in this folder.`}
                        />
                    </Label>
                    <Field className="pt0-5">
                        <Toggle
                            id="notification"
                            checked={folder.Notify === 1}
                            onChange={({ target }) => onChangeNotify?.(+target.checked)}
                        />
                    </Field>
                </Row>
            </>
        );
    };

    return (
        <div className="center flex-item-fluid">
            {!labelOrFolder.ID && labelOrFolder.Type === LABEL_TYPE.MESSAGE_FOLDER ? (
                <Alert>{c('Info')
                    .t`Name your new folder and select the parent folder you want to put it in. If you do not select a parent folder, this new folder will be created as a top level folder.`}</Alert>
            ) : null}
            <Row>
                <Label htmlFor="accountName">
                    {labelOrFolder.Type === LABEL_TYPE.MESSAGE_FOLDER
                        ? c('New Label form').t`Folder name`
                        : c('New Label form').t`Label name`}
                </Label>
                <Field>
                    <Input
                        id="accountName"
                        value={labelOrFolder.Name}
                        onChange={onChangeName}
                        placeholder={
                            labelOrFolder.Type === LABEL_TYPE.MESSAGE_FOLDER
                                ? c('New Label form').t`Folder name`
                                : c('New Label form').t`Label name`
                        }
                        required
                        data-test-id="label/folder-modal:name"
                        autoFocus
                    />
                </Field>
            </Row>
            {labelOrFolder.Type === LABEL_TYPE.MESSAGE_LABEL && labelRenderer()}
            {labelOrFolder.Type === LABEL_TYPE.MESSAGE_FOLDER && folderRenderer()}
        </div>
    );
}

export default NewLabelForm;
