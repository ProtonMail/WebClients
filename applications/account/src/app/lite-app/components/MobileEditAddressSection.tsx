import { useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { updateAddressThunk } from '@proton/account/addresses/updateAddress';
import { Button } from '@proton/atoms/Button/Button';
import Form from '@proton/components/components/form/Form';
import { InputField as InputFieldTwo } from '@proton/components/components/v2/field/InputField';
import type { SimpleEditorActions } from '@proton/components/containers/editor/SimpleEditorContext';
import useErrorHandler from '@proton/components/hooks/useErrorHandler';
import type { WithLoading } from '@proton/hooks/useLoading';
import SimpleEditor from '@proton/mail-composer/components/editor/SimpleEditor';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import type { Address } from '@proton/shared/lib/interfaces/Address';
import { formatSignature } from '@proton/shared/lib/mail/signature';

import MobileSectionLabel from './MobileSectionLabel';

interface Props {
    address: Address;
    onAddressUpdate: WithLoading;
    isSavingAddressUpdates: boolean;
}

const MobileEditAddressSection = ({ address, onAddressUpdate, isSavingAddressUpdates }: Props) => {
    const dispatch = useDispatch();
    const handleError = useErrorHandler();
    const [editorReady, setEditorReady] = useState(false);
    const [displayName, setDisplayName] = useState(address.DisplayName);
    const [signatureUpdated, setSignatureUpdated] = useState(false);

    const editorRef = useRef<SimpleEditorActions>();

    const handleReady = (actions: SimpleEditorActions) => {
        actions.setContent(address.Signature);
        editorRef.current = actions;
        setEditorReady(true);
    };

    const handleSubmit = async () => {
        try {
            const signature = signatureUpdated ? editorRef.current?.getContent() || '' : address.Signature;
            await dispatch(updateAddressThunk({ address, displayName, signature: formatSignature(signature) }));
        } catch (e) {
            handleError(e);
        }
    };

    // On address change
    useEffect(() => {
        setDisplayName(address.DisplayName);
        const timeoutId = setTimeout(() => {
            if (editorRef?.current && editorReady) {
                setSignatureUpdated(false);
                editorRef.current.setContent(address.Signature);
            }
        }, 100);
        return () => clearTimeout(timeoutId);
    }, [address]);

    return (
        <Form
            onSubmit={async (e) => {
                e.preventDefault();
                await onAddressUpdate(handleSubmit());
            }}
        >
            <MobileSectionLabel htmlFor="displayName">{c('Label').t`Display name`}</MobileSectionLabel>
            <InputFieldTwo
                id="displayName"
                value={displayName}
                placeholder={c('Placeholder').t`Choose display name`}
                maxLength={255}
                onValue={setDisplayName}
            />

            <MobileSectionLabel htmlFor="editor">{c('Label').t`Signature`}</MobileSectionLabel>
            <SimpleEditor
                onReady={handleReady}
                onChange={() => {
                    setSignatureUpdated(true);
                }}
            />

            <Button
                color="norm"
                type="submit"
                disabled={isSavingAddressUpdates}
                loading={isSavingAddressUpdates}
                className="mt-4 w-full"
            >
                {c('Action').t`Save`}
            </Button>
        </Form>
    );
};

export default MobileEditAddressSection;
