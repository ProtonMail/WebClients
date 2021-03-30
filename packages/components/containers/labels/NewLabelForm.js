import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { LABEL_TYPE } from 'proton-shared/lib/constants';
import { Alert, Input, Label, Row, Field, ColorPicker, Toggle, Info } from '../../components';

import ParentFolderSelector from './ParentFolderSelector';
import { useMailSettings } from '../../hooks';

function NewLabelForm({ label, onChangeColor, onChangeName, onChangeParentID, onChangeNotify }) {
    const [mailSettings] = useMailSettings();

    return (
        <div className="center flex-item-fluid">
            {!label.ID && label.Type === LABEL_TYPE.MESSAGE_FOLDER ? (
                <Alert>{c('Info')
                    .t`Name your new folder and select the parent folder you want to put it in. If you do not select a parent folder, this new folder will be created as a top level folder.`}</Alert>
            ) : null}
            <Row>
                <Label htmlFor="accountName">
                    {label.Type === LABEL_TYPE.MESSAGE_FOLDER
                        ? c('New Label form').t`Folder name`
                        : c('New Label form').t`Label name`}
                </Label>
                <Field>
                    <Input
                        id="accountName"
                        value={label.Name}
                        onChange={onChangeName}
                        placeholder={
                            label.Type === LABEL_TYPE.MESSAGE_FOLDER
                                ? c('New Label form').t`Folder name`
                                : c('New Label form').t`Label name`
                        }
                        required
                        data-test-id="label/folder-modal:name"
                    />
                </Field>
            </Row>
            {label.Type === LABEL_TYPE.MESSAGE_LABEL ? (
                <Row>
                    <Label htmlFor="accountType">{c('New Label form').t`Color`} </Label>
                    <Field>
                        <ColorPicker color={label.Color} onChange={onChangeColor} />
                    </Field>
                </Row>
            ) : null}
            {label.Type === LABEL_TYPE.MESSAGE_FOLDER ? (
                <>
                    <Row>
                        <Label htmlFor="parentID">{c('Label').t`Folder location`}</Label>
                        <Field>
                            <ParentFolderSelector
                                id="parentID"
                                value={label.ParentID}
                                onChange={onChangeParentID}
                                disableOptions={[label.ID]}
                            />
                        </Field>
                    </Row>
                    {mailSettings?.EnableFolderColor ? (
                        <Row>
                            <Label htmlFor="accountType">{c('New Label form').t`Color`} </Label>
                            <Field>
                                {mailSettings?.InheritParentFolderColor && label.ParentID ? (
                                    <div className="mt0-5">{c('Info').t`Inherited from parent folder`}</div>
                                ) : (
                                    <ColorPicker color={label.Color} onChange={onChangeColor} />
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
                                checked={label.Notify === 1}
                                onChange={({ target }) => onChangeNotify(+target.checked)}
                            />
                        </Field>
                    </Row>
                </>
            ) : null}
        </div>
    );
}

NewLabelForm.propTypes = {
    label: PropTypes.object,
    onChangeName: PropTypes.func.isRequired,
    onChangeColor: PropTypes.func.isRequired,
    onChangeParentID: PropTypes.func,
    onChangeNotify: PropTypes.func,
};

export default NewLabelForm;
