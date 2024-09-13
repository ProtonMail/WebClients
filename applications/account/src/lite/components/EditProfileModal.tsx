import type { FormEvent } from 'react';
import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import type { EditorActions, ModalProps } from '@proton/components';
import {
    Editor,
    Form,
    InputFieldTwo,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    useApi,
    useEventManager,
    useFormErrors,
} from '@proton/components';
import { useToolbar } from '@proton/components/components/editor/hooks/useToolbar';
import useLoading from '@proton/hooks/useLoading';
import { updateAddress } from '@proton/shared/lib/api/addresses';
import type { Address } from '@proton/shared/lib/interfaces';

interface Props extends ModalProps {
    address: Address;
}

const EditProfileModal = ({ address, ...rest }: Props) => {
    const [displayName, setDisplayName] = useState(address.DisplayName);
    const [signature, setSignature] = useState(address.Signature);
    const api = useApi();
    const [submitting, withLoading] = useLoading();
    const { onFormSubmit } = useFormErrors();
    const { call } = useEventManager();
    const { openEmojiPickerRef, toolbarConfig, setToolbarConfig, modalLink, modalImage, modalDefaultFont } = useToolbar(
        {}
    );

    const handleSubmit = async () => {
        await api(
            updateAddress(address.ID, {
                DisplayName: displayName,
                Signature: signature,
            })
        );
        await call();
        rest.onClose?.();
    };
    const handleClose = submitting ? undefined : rest.onClose;
    const handleReady = (actions: EditorActions) => {
        actions.setContent(signature);
    };

    return (
        <ModalTwo
            as={Form}
            {...rest}
            onClose={handleClose}
            onSubmit={(event: FormEvent) => {
                event.preventDefault();
                event.stopPropagation();
                if (!onFormSubmit()) {
                    return;
                }
                void withLoading(handleSubmit());
            }}
        >
            <ModalTwoHeader title={c('Title').t`Edit profile`} />
            <ModalTwoContent>
                <InputFieldTwo
                    id="displayName"
                    autoFocus
                    value={displayName}
                    maxLength={255}
                    onValue={setDisplayName}
                    label={c('Label').t`New display name`}
                />
                <label className="field-two-label-container flex justify-space-between flex-nowrap items-end gap-2">{c(
                    'Label'
                ).t`Signature`}</label>
                <Editor
                    onReady={handleReady}
                    onChange={setSignature}
                    simple
                    openEmojiPickerRef={openEmojiPickerRef}
                    toolbarConfig={toolbarConfig}
                    setToolbarConfig={setToolbarConfig}
                    modalLink={modalLink}
                    modalImage={modalImage}
                    modalDefaultFont={modalDefaultFont}
                />
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button onClick={handleClose} disabled={submitting}>
                    {c('Action').t`Cancel`}
                </Button>
                <Button type="submit" loading={submitting} color="norm">
                    {c('Action').t`Save`}
                </Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default EditProfileModal;
