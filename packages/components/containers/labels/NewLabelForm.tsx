import { c } from 'ttag';

import ColorPicker from '@proton/components/components/input/ColorPicker';
import Label from '@proton/components/components/label/Label';
import Info from '@proton/components/components/link/Info';
import Toggle from '@proton/components/components/toggle/Toggle';
import InputFieldTwo from '@proton/components/components/v2/field/InputField';
import { useMailSettings } from '@proton/mail/mailSettings/hooks';
import { getColorName } from '@proton/shared/lib/colors';
import { LABEL_TYPE } from '@proton/shared/lib/constants';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import type { Folder } from '@proton/shared/lib/interfaces/Folder';
import type { Label as tsLabel } from '@proton/shared/lib/interfaces/Label';

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

    const ColorPickerLabel = (color: string) => {
        const colorName = getColorName(color);

        return (
            <>
                <span>{c('New Label form').t`Color`}:</span>
                {colorName && <span className="color-weak text-capitalize text-no-bold ml-2">{colorName}</span>}
            </>
        );
    };

    const labelRenderer = () => {
        const label = labelOrFolder as tsLabel;

        return (
            <div>
                <InputFieldTwo
                    as={ColorPicker}
                    layout="inline"
                    label={ColorPickerLabel(label.Color)}
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
                            <div className="mb-4">
                                <strong className="text-semibold">{c('New Label form').t`Color`} </strong>
                                <div className="mt-2">{c('Info').t`Inherited from parent folder`}</div>
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
                <div className="flex justify-start items-center">
                    <Label htmlFor="notification" className="w-auto">
                        <span className="inline-flex items-center">
                            <span className="mr-2 text-semibold">{c('Label').t`Notification`}</span>
                            <Info
                                title={c('Info')
                                    .t`You can turn on notifications to get alerts when new email messages arrive in this folder.`}
                            />
                        </span>
                    </Label>
                    <div className="pt-2 ml-4">
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
        <div className="mx-auto flex-1">
            {!labelOrFolder.ID && labelOrFolder.Type === LABEL_TYPE.MESSAGE_FOLDER ? (
                <div className="mb-4">
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
                    data-testid="label/folder-modal:name"
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
