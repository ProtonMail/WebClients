import type { FormEvent } from 'react';
import { useState } from 'react';

import { c } from 'ttag';

import { updateAddressThunk } from '@proton/account/addresses/updateAddress';
import { Button } from '@proton/atoms/Button/Button';
import Editor from '@proton/components/components/editor/Editor';
import { useToolbar } from '@proton/components/components/editor/hooks/useToolbar';
import type { EditorActions } from '@proton/components/components/editor/interface';
import Form from '@proton/components/components/form/Form';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import InputFieldTwo from '@proton/components/components/v2/field/InputField';
import useFormErrors from '@proton/components/components/v2/useFormErrors';
import useErrorHandler from '@proton/components/hooks/useErrorHandler';
import useLoading from '@proton/hooks/useLoading';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import type { Address } from '@proton/shared/lib/interfaces';

interface Props extends ModalProps {
    address: Address;
}

const EditProfileModal = ({ address, ...rest }: Props) => {
    const dispatch = useDispatch();
    const [displayName, setDisplayName] = useState(address.DisplayName);
    const [signature, setSignature] = useState(address.Signature);
    const [submitting, withLoading] = useLoading();
    const { onFormSubmit } = useFormErrors();
    const { openEmojiPickerRef, toolbarConfig, setToolbarConfig, modalLink, modalImage, modalDefaultFont } = useToolbar(
        {}
    );
    const handleError = useErrorHandler();

    const handleSubmit = async () => {
        try {
            await dispatch(updateAddressThunk({ address, displayName, signature }));
            rest.onClose?.();
        } catch (e) {
            handleError(e);
        }
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
                    placeholder={c('Placeholder').t`Choose display name`}
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
