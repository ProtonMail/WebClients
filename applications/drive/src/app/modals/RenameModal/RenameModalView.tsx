import type { ChangeEvent, FocusEvent } from 'react';
import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import {
    Field,
    InputFieldTwo,
    Label,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    Row,
} from '@proton/components';
import useLoading from '@proton/hooks/useLoading';
import noop from '@proton/utils/noop';

import { validateLinkNameField } from '../../store';

// Props need to be exported with a proper unique name, we can't call them "Props" anymore
export type RenameModalViewProps = {
    handleSubmit: (newName: string) => Promise<void>;
    isFile: boolean;
    onClose?: () => void;
    name: string;
    ignoreExtension: boolean;
    isDoc?: boolean;
};

export const RenameModalView = ({
    handleSubmit,
    onClose,
    name: originalName,
    isFile,
    ignoreExtension,
    isDoc, // here so they don't get added to the dom with modalProps
    ...modalProps
}: RenameModalViewProps) => {
    const [autofocusDone, setAutofocusDone] = useState(false);
    const [tempName, setTempName] = useState(originalName);
    const [loading, withLoading] = useLoading();

    const selectNamePart = (e: FocusEvent<HTMLInputElement>) => {
        if (autofocusDone) {
            return;
        }
        setAutofocusDone(true);
        if (ignoreExtension) {
            return e.target.select();
        }
        e.target.setSelectionRange(0, originalName.length);
    };

    const onBlur = ({ target }: FocusEvent<HTMLInputElement>) => {
        setTempName(target.value.trim());
    };

    const onChange = ({ target }: ChangeEvent<HTMLInputElement>) => {
        setTempName(target.value);
    };

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const formattedName = tempName.trim();
        setTempName(formattedName);

        return handleSubmit(formattedName);
    };

    const validationError = validateLinkNameField(tempName);

    return (
        <ModalTwo
            as="form"
            disableCloseOnEscape={loading}
            onClose={onClose}
            onSubmit={(e: React.FormEvent) => withLoading(onSubmit(e)).catch(noop)}
            size="large"
            {...modalProps}
        >
            <ModalTwoHeader
                closeButtonProps={{ disabled: loading }}
                title={!isFile ? c('Title').t`Rename a folder` : c('Title').t`Rename a file`}
            />
            <ModalTwoContent>
                <Row className="my-4">
                    <Label>{!isFile ? c('Label').t`Folder name` : c('Label').t`File name`}</Label>
                    <Field>
                        <InputFieldTwo
                            id="link-name"
                            value={tempName}
                            autoFocus
                            placeholder={c('Placeholder').t`New name`}
                            onChange={onChange}
                            onBlur={onBlur}
                            onFocus={selectNamePart}
                            error={validationError}
                            required
                            data-testid="input-rename"
                        />
                    </Field>
                </Row>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button type="button" onClick={onClose} disabled={loading}>
                    {c('Action').t`Cancel`}
                </Button>
                <Button color="norm" type="submit" loading={loading}>
                    {c('Action').t`Rename`}
                </Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};
