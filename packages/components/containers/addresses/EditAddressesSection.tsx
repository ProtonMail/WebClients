import type { ChangeEvent } from 'react';
import { useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { updateAddressThunk } from '@proton/account/addresses/updateAddress';
import { useNotifications } from '@proton/app-context/useNotifications';
import { Button } from '@proton/atoms/Button/Button';
import { DashboardCardDivider } from '@proton/atoms/DashboardCard/DashboardCard';
import { Href } from '@proton/atoms/Href/Href';
import { Input } from '@proton/atoms/Input/Input';
import { useHotkeys } from '@proton/hooks/useHotkeys';
import useLoading from '@proton/hooks/useLoading';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import type { Address } from '@proton/shared/lib/interfaces/Address';
import { formatSignature } from '@proton/shared/lib/mail/signature';

import useActiveBreakpoint from '../../hooks/useActiveBreakpoint';
import useErrorHandler from '../../hooks/useErrorHandler';
import { SettingsSelectRow } from '../account/SettingsSelectRow';
import type { SimpleEditorActions } from '../editor/SimpleEditorContext';
import { useSimpleEditor } from '../editor/SimpleEditorContext';

interface Props {
    address: Address;
}

const EditAddressesSection = ({ address }: Props) => {
    const [mailSettings] = useMailSettings();
    const dispatch = useDispatch();
    const handleError = useErrorHandler();
    const [loading, withLoading] = useLoading();
    const [editorReady, setEditorReady] = useState(false);
    const [displayName, setDisplayName] = useState(address.DisplayName);
    const [signatureUpdated, setSignatureUpdated] = useState(false);
    const { createNotification } = useNotifications();
    const { viewportWidth } = useActiveBreakpoint();

    const editorWrapperRef = useRef<HTMLDivElement>(null);
    const editorRef = useRef<SimpleEditorActions>(undefined);
    const SimpleEditor = useSimpleEditor();

    const handleReady = (actions: SimpleEditorActions) => {
        actions.setContent(address.Signature);
        editorRef.current = actions;
        setEditorReady(true);
    };

    const handleDisplayName = ({ target }: ChangeEvent<HTMLInputElement>) => {
        setDisplayName(target.value);
    };

    const handleSubmit = async () => {
        try {
            const signature = signatureUpdated ? editorRef.current?.getContent() || '' : address.Signature;
            await dispatch(updateAddressThunk({ address, displayName, signature: formatSignature(signature) }));
            createNotification({ text: c('Success').t`Address updated` });
        } catch (e) {
            handleError(e);
        }
    };

    useHotkeys(editorWrapperRef, [
        [
            ['Meta', 'Enter'],
            () => {
                if (mailSettings.Shortcuts) {
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

    return (
        <form
            onSubmit={async (e) => {
                e.preventDefault();
                await withLoading(handleSubmit());
            }}
        >
            <SettingsSelectRow
                id="displayName"
                label={<SettingsSelectRow.Label>{c('Label').t`Display name`}</SettingsSelectRow.Label>}
                select={
                    <Input
                        id="displayName"
                        value={displayName}
                        placeholder={c('Placeholder').t`Choose display name`}
                        onChange={handleDisplayName}
                        data-testid="settings:identity-section:display-name"
                    />
                }
            />

            <DashboardCardDivider />

            <div className="flex flex-column flex-nowrap gap-3">
                <div className="flex flex-column gap-1">
                    {/* eslint-disable-next-line */}
                    <label
                        htmlFor="rooster-editor"
                        className="text-semibold"
                        onClick={() => editorRef.current?.focus()}
                    >
                        {c('Label').t`Signature`}
                    </label>
                    <p className="m-0 text-sm color-weak">
                        <Href href={getKnowledgeBaseUrl('/display-name-email-signature')}>
                            {c('Tooltip').t`Click here to learn how to create a customized signature with HTML.`}
                        </Href>
                    </p>
                </div>
                <div ref={editorWrapperRef} tabIndex={-1}>
                    <SimpleEditor
                        onReady={handleReady}
                        onChange={() => {
                            setSignatureUpdated(true);
                        }}
                        isSmallViewportForToolbar={viewportWidth['<=medium']}
                        mailSettings={mailSettings}
                        title={c('Label').t`Signature`}
                    />
                </div>
                <div>
                    <Button
                        color="norm"
                        type="submit"
                        disabled={loading}
                        loading={loading}
                        data-testid="settings:identity-section:update"
                    >
                        {c('Action').t`Update`}
                    </Button>
                </div>
            </div>
        </form>
    );
};

export default EditAddressesSection;
