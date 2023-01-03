import { KeyboardEvent, Ref } from 'react';

import { EasyTrans } from '@proton/activation/helpers/easyTrans';
import { MailImportPayloadError } from '@proton/activation/interface';
import { InputFieldTwo } from '@proton/components/components';

interface Props {
    disabled: boolean;
    errors: MailImportPayloadError[];
    handleChange: (val: any) => void;
    handleSave: (val: any) => void;
    hasError: boolean;
    inputRef: Ref<any>;
    inputValue: string;
    isLabelMapping: boolean;
}

const ManageFolderRowInput = ({
    disabled,
    errors,
    handleChange,
    handleSave,
    hasError,
    inputRef,
    inputValue,
    isLabelMapping,
}: Props) => {
    const trans = EasyTrans.get(isLabelMapping);

    let error;

    const tooLongErrors = [MailImportPayloadError.FOLDER_NAMES_TOO_LONG, MailImportPayloadError.LABEL_NAMES_TOO_LONG];

    if (tooLongErrors.some((error) => errors.includes(error))) {
        error = trans.errorNameTooLong();
    }

    if (errors.includes(MailImportPayloadError.UNAVAILABLE_NAMES)) {
        error = trans.errorNameAlreadyExists();
    }

    if (errors.includes(MailImportPayloadError.EMPTY)) {
        error = trans.errorEmptyValue();
    }

    if (errors.includes(MailImportPayloadError.RESERVED_NAMES)) {
        error = trans.errorReservedName();
    }

    return (
        <InputFieldTwo
            autoFocus
            disabled={disabled}
            required
            ref={inputRef}
            value={inputValue}
            onChange={handleChange}
            onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    if (hasError) {
                        return;
                    }
                    handleSave(e);
                }
            }}
            dense
            error={error}
            className="hauto"
        />
    );
};

export default ManageFolderRowInput;
