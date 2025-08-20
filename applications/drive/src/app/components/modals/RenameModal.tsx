import type { ChangeEvent, FocusEvent } from 'react';
import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import type { ModalStateProps } from '@proton/components';
import {
    Field,
    InputFieldTwo,
    Label,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    Row,
    useModalTwoStatic,
} from '@proton/components';
import type { NodeEntity } from '@proton/drive';
import { useLoading } from '@proton/hooks';
import useFlag from '@proton/unleash/useFlag';
import noop from '@proton/utils/noop';

import { RenameModal } from '../../modals/RenameModal';
import { formatLinkName, splitLinkName, validateLinkNameField } from '../../store';
import { getIsPublicContext } from '../../utils/getIsPublicContext';

interface Props {
    onClose?: () => void;
    onSubmit?: (newName: string) => Promise<void>;
    isFile: boolean;
    isDoc?: boolean;
    name: string;
    volumeId: string;
    linkId: string;
    onSuccess?: (node: NodeEntity) => void;
}

const RenameModalDeprecated = ({
    isFile,
    isDoc,
    name: linkName,
    onClose,
    onSubmit,
    volumeId,
    linkId,
    ...modalProps
}: Props & ModalStateProps) => {
    const [name, setName] = useState(linkName);
    const [loading, withLoading] = useLoading();
    const [autofocusDone, setAutofocusDone] = useState(false);

    const selectNamePart = (e: FocusEvent<HTMLInputElement>) => {
        if (autofocusDone) {
            return;
        }
        setAutofocusDone(true);
        const [namePart] = splitLinkName(linkName);
        if (!namePart || !isFile || isDoc) {
            return e.target.select();
        }
        e.target.setSelectionRange(0, namePart.length);
    };

    const handleBlur = ({ target }: FocusEvent<HTMLInputElement>) => {
        setName(formatLinkName(target.value));
    };

    const handleChange = ({ target }: ChangeEvent<HTMLInputElement>) => {
        setName(target.value);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const formattedName = formatLinkName(name);
        setName(formattedName);

        await onSubmit?.(formattedName);
        onClose?.();
    };

    const validationError = validateLinkNameField(name);

    return (
        <ModalTwo
            as="form"
            disableCloseOnEscape={loading}
            onClose={onClose}
            onSubmit={(e: React.FormEvent) => withLoading(handleSubmit(e)).catch(noop)}
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
                            value={name}
                            autoFocus
                            placeholder={c('Placeholder').t`New name`}
                            onChange={handleChange}
                            onBlur={handleBlur}
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

export const useRenameModal = () => {
    const useSDKModal = useFlag('DriveWebSDKRenameModal');
    const isPublic = getIsPublicContext();

    const [renameModal, showRenameModal] = useModalTwoStatic(
        useSDKModal && !isPublic ? RenameModal : RenameModalDeprecated
    );

    return [renameModal, showRenameModal] as const;
};
