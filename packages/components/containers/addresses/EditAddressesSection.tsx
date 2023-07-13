import { ChangeEvent, useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { Button, Input } from '@proton/atoms';
import { useToolbar } from '@proton/components/components/editor/hooks/useToolbar';
import { useLoading } from '@proton/hooks';
import { updateAddress } from '@proton/shared/lib/api/addresses';
import { Address } from '@proton/shared/lib/interfaces';

import { Editor, EditorActions } from '../../components';
import { useApi, useEventManager, useHotkeys, useMailSettings, useNotifications } from '../../hooks';
import SettingsLayout from '../account/SettingsLayout';
import SettingsLayoutLeft from '../account/SettingsLayoutLeft';
import SettingsLayoutRight from '../account/SettingsLayoutRight';

const EMPTY_VALUES = [/^(<div><br><\/div>)+$/, /^(<div>\s*<\/div>)+$/];

const formatSignature = (value: string) => (EMPTY_VALUES.some((regex) => regex.test(value)) ? '' : value);

interface Props {
    address: Address;
}

const EditAddressesSection = ({ address }: Props) => {
    const [{ Shortcuts = 0 } = {}] = useMailSettings();
    const api = useApi();
    const { call } = useEventManager();
    const [loading, withLoading] = useLoading();
    const [editorReady, setEditorReady] = useState(false);
    const [displayName, setDisplayName] = useState(address.DisplayName);
    const [signatureUpdated, setSignatureUpdated] = useState(false);
    const { createNotification } = useNotifications();

    const editorWrapperRef = useRef<HTMLDivElement>(null);
    const editorRef = useRef<EditorActions>();

    const handleReady = (actions: EditorActions) => {
        actions.setContent(address.Signature);
        editorRef.current = actions;
        setEditorReady(true);
    };

    const handleDisplayName = ({ target }: ChangeEvent<HTMLInputElement>) => {
        setDisplayName(target.value);
    };

    const handleSubmit = async () => {
        const signature = signatureUpdated ? (editorRef.current?.getContent() as string) : address.Signature;

        await api(
            updateAddress(address.ID, {
                DisplayName: displayName,
                Signature: formatSignature(signature),
            })
        );
        await call();
        createNotification({ text: c('Success').t`Address updated` });
    };

    useHotkeys(editorWrapperRef, [
        [
            ['Meta', 'Enter'],
            () => {
                if (Shortcuts) {
                    void withLoading(handleSubmit());
                }
            },
        ],
    ]);

    // On address change
    useEffect(() => {
        setDisplayName(address.DisplayName);
        setTimeout(() => {
            if (editorRef?.current && editorReady) {
                setSignatureUpdated(false);
                editorRef.current.setContent(address.Signature);
            }
        }, 100);
    }, [address]);

    const { openEmojiPickerRef, toolbarConfig, setToolbarConfig, modalLink, modalImage, modalDefaultFont } = useToolbar(
        {}
    );

    return (
        <form
            onSubmit={async (e) => {
                e.preventDefault();
                await withLoading(handleSubmit());
            }}
        >
            <SettingsLayout>
                <SettingsLayoutLeft>
                    <label htmlFor="displayName" className="text-semibold">
                        {c('Label').t`Display name`}
                    </label>
                </SettingsLayoutLeft>
                <SettingsLayoutRight>
                    <Input
                        id="displayName"
                        value={displayName}
                        placeholder={c('Placeholder').t`Choose display name`}
                        onChange={handleDisplayName}
                        data-testid="settings:identity-section:display-name"
                    />
                </SettingsLayoutRight>
            </SettingsLayout>

            <SettingsLayout>
                <SettingsLayoutLeft>
                    <label htmlFor="editor" className="text-semibold" onClick={() => editorRef.current?.focus()}>
                        {c('Label').t`Signature`}
                    </label>
                </SettingsLayoutLeft>
                <SettingsLayoutRight>
                    <div ref={editorWrapperRef} tabIndex={-1}>
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
                    </div>

                    <Button
                        color="norm"
                        type="submit"
                        disabled={loading}
                        loading={loading}
                        className="mt-4"
                        data-testid="settings:identity-section:update"
                    >
                        {c('Action').t`Update`}
                    </Button>
                </SettingsLayoutRight>
            </SettingsLayout>
        </form>
    );
};

export default EditAddressesSection;
