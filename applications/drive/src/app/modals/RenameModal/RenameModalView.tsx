import type { ChangeEvent, FocusEvent } from 'react';
import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
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
import type { ModalProps } from '@proton/components';
import useLoading from '@proton/hooks/useLoading';
import noop from '@proton/utils/noop';

import { validateLinkNameField } from '../../store';

// Props need to be exported with a proper unique name, we can't call them "Props" anymore
export type RenameModalViewProps = {
    handleSubmit: (newName: string) => Promise<void>;
    isFile: boolean;
    onClose?: () => void;
    name: string;
    // The name (or part of it) that will need to be highlighted at
    // focus time in the modal's input.
    nameToFocus: string;
    isDoc?: boolean;
};

export const RenameModalView = ({
    handleSubmit,
    name: originalName,
    isFile,
    nameToFocus,
    // modalProps
    onClose,
    onExit,
    open,
}: RenameModalViewProps & ModalProps) => {
    const [autofocusDone, setAutofocusDone] = useState(false);
    const [tempName, setTempName] = useState(originalName);
    const [loading, withLoading] = useLoading();

    const selectNamePart = (e: FocusEvent<HTMLInputElement>) => {
        if (autofocusDone) {
            return;
        }
        e.target.setSelectionRange(0, nameToFocus.length);
        setAutofocusDone(true);
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
            onExit={onExit}
            open={open}
            onSubmit={(e: React.FormEvent) => withLoading(onSubmit(e)).catch(noop)}
            size="large"
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
