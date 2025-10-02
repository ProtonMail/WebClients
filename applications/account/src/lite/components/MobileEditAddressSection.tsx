import { useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { updateAddressThunk } from '@proton/account/addresses/updateAddress';
import { Button } from '@proton/atoms';
import { Editor, type EditorActions, Form, InputFieldTwo, useErrorHandler } from '@proton/components';
import { useToolbar } from '@proton/components/components/editor/hooks/useToolbar';
import type { WithLoading } from '@proton/hooks/useLoading';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import type { Address } from '@proton/shared/lib/interfaces';
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

    const editorRef = useRef<EditorActions>();

    const handleReady = (actions: EditorActions) => {
        actions.setContent(address.Signature);
        editorRef.current = actions;
        setEditorReady(true);
    };

    const handleSubmit = async () => {
        try {
            const signature = signatureUpdated ? (editorRef.current?.getContent() as string) : address.Signature;
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

    const { openEmojiPickerRef, toolbarConfig, setToolbarConfig, modalLink, modalImage, modalDefaultFont } = useToolbar(
        {}
    );

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
            <Editor
                onReady={handleReady}
                onChange={() => {
                    setSignatureUpdated(true);
                }}
                simple
                openEmojiPickerRef={openEmojiPickerRef}
                toolbarConfig={toolbarConfig}
                setToolbarConfig={setToolbarConfig}
                modalLink={modalLink}
                modalImage={modalImage}
                modalDefaultFont={modalDefaultFont}
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
