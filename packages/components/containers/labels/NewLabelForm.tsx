import { c } from 'ttag';

import { ACCENT_COLORNAMES, LABEL_TYPE } from '@proton/shared/lib/constants';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import { Folder } from '@proton/shared/lib/interfaces/Folder';
import { Label as tsLabel } from '@proton/shared/lib/interfaces/Label';

import { ColorPicker, Info, InputFieldTwo, Label, Toggle } from '../../components';
import { useMailSettings } from '../../hooks';
import ParentFolderSelector from './ParentFolderSelector';

interface Props {
    label: Partial<tsLabel | Folder>;
    onChangeName: (value: string) => void;
    onChangeColor: (color: string) => void;
    onChangeParentID?: (parentID: string | number) => void;
    onChangeNotify?: (value: number) => void;
    validator: (validations: string[]) => string;
}

function NewLabelForm({
    label: labelOrFolder,
    onChangeColor,
    onChangeName,
    onChangeParentID,
    onChangeNotify,
    validator,
}: Props) {
    const [mailSettings] = useMailSettings();

    const colorName = (color: string) =>
        Object.values(ACCENT_COLORNAMES)
            .filter((item) => item.color.includes(color.toUpperCase()))[0]
            .getName() || undefined;
    const ColorPickerLabel = (color: string) => (
        <>
            <span>{c('New Label form').t`Color`}:</span>
            {colorName(color) && (
                <span className="color-weak text-capitalize text-no-bold ml0-5">{colorName(color)}</span>
            )}
        </>
    );

    const labelRenderer = () => {
        const label = labelOrFolder as tsLabel;

        return (
            <div>
                <InputFieldTwo
                    as={ColorPicker}
                    layout="inline"
                    label={ColorPickerLabel(label.Color)}
                    // labelContainerClassName="sr-only"
                    id="color-button"
                    data-testid="color-button"
                    color={label.Color}
                    onChange={onChangeColor}
                />
            </div>
        );
    };

    const folderRenderer = () => {
        const folder = labelOrFolder as Folder;

        return (
            <>
                <div>
                    <ParentFolderSelector
                        id="parentID"
                        label={c('Label').t`Folder location`}
                        value={folder.ParentID || 0}
                        onChange={onChangeParentID}
                        disableOptions={[folder.ID]}
                    />
                </div>
                {mailSettings?.EnableFolderColor ? (
                    <div>
                        {mailSettings?.InheritParentFolderColor && folder.ParentID ? (
                            <div className="mb1">
                                <strong className="text-semibold">{c('New Label form').t`Color`} </strong>
                                <div className="mt0-5">{c('Info').t`Inherited from parent folder`}</div>
                            </div>
                        ) : (
                            <InputFieldTwo
                                as={ColorPicker}
                                layout="inline"
                                label={ColorPickerLabel(folder.Color)}
                                id="color-button"
                                data-testid="color-button"
                                color={folder.Color}
                                onChange={onChangeColor}
                            />
                        )}
                    </div>
                ) : null}
                <div className="flex flex-justify-start flex-align-items-center">
                    <Label htmlFor="notification" className="wauto">
                        <span className="inline-flex flex-align-items-center">
                            <span className="mr0-5 text-semibold">{c('Label').t`Notification`}</span>
                            <Info
                                title={c('Info')
                                    .t`You can turn on notifications to get alerts when new email messages arrive in this folder.`}
                            />
                        </span>
                    </Label>
                    <div className="pt0-5 ml1">
                        <Toggle
                            id="notification"
                            checked={folder.Notify === 1}
                            onChange={({ target }) => onChangeNotify?.(+target.checked)}
                        />
                    </div>
                </div>
            </>
        );
    };

    return (
        <div className="mxauto flex-item-fluid">
            {!labelOrFolder.ID && labelOrFolder.Type === LABEL_TYPE.MESSAGE_FOLDER ? (
                <div className="mb1">
                    {c('Info')
                        .t`Name your new folder and select the parent folder you want to put it in. If you do not select a parent folder, this new folder will be created as a top level folder.`}
                </div>
            ) : null}
            <div>
                <InputFieldTwo
                    id="folder"
                    label={
                        labelOrFolder.Type === LABEL_TYPE.MESSAGE_FOLDER
                            ? c('New Label form').t`Folder name`
                            : c('New Label form').t`Label name`
                    }
                    value={labelOrFolder.Name}
                    onValue={onChangeName}
                    placeholder={
                        labelOrFolder.Type === LABEL_TYPE.MESSAGE_FOLDER
                            ? c('New Label form').t`Folder name`
                            : c('New Label form').t`Label name`
                    }
                    data-test-id="label/folder-modal:name"
                    autoFocus
                    error={validator([requiredValidator(labelOrFolder.Name)])}
                />
            </div>
            {labelOrFolder.Type === LABEL_TYPE.MESSAGE_LABEL && labelRenderer()}
            {labelOrFolder.Type === LABEL_TYPE.MESSAGE_FOLDER && folderRenderer()}
        </div>
    );
}

export default NewLabelForm;
