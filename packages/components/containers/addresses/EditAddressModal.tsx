import { ChangeEvent, useState } from 'react';

import { c } from 'ttag';

import { useToolbar } from '@proton/components/components/editor/hooks/useToolbar';
import { useLoading } from '@proton/hooks';
import { updateAddress } from '@proton/shared/lib/api/addresses';
import { Address } from '@proton/shared/lib/interfaces';

import { Editor, EditorActions, Field, FormModal, Input, Label, Row } from '../../components';
import { useApi, useEventManager, useNotifications } from '../../hooks';

const EMPTY_VALUES = [/^(<div><br><\/div>)+$/, /^(<div>\s*<\/div>)+$/];

const formatSignature = (value: string) => (EMPTY_VALUES.some((regex) => regex.test(value)) ? '' : value);

interface Props {
    onClose?: () => void;
    address: Address;
}
const EditAddressModal = ({ onClose, address, ...rest }: Props) => {
    const api = useApi();
    const { call } = useEventManager();
    const [loading, withLoading] = useLoading();
    const [model, updateModel] = useState({
        displayName: address.DisplayName,
        signature: address.Signature,
    });
    const { createNotification } = useNotifications();

    const handleReady = (actions: EditorActions) => {
        actions.setContent(model.signature);
    };

    const handleDisplayName = ({ target }: ChangeEvent<HTMLInputElement>) =>
        updateModel({ ...model, displayName: target.value });

    const handleSignature = (value: string) => updateModel({ ...model, signature: value });

    const handleSubmit = async () => {
        await api(
            updateAddress(address.ID, { DisplayName: model.displayName, Signature: formatSignature(model.signature) })
        );
        await call();
        onClose?.();
        createNotification({ text: c('Success').t`Address updated` });
    };

    const { openEmojiPickerRef, toolbarConfig, setToolbarConfig, modalLink, modalImage, modalDefaultFont } = useToolbar(
        {}
    );

    return (
        <FormModal
            onClose={onClose}
            onSubmit={() => withLoading(handleSubmit())}
            title={c('Title').t`Edit address`}
            submit={c('Action').t`Save address`}
            loading={loading}
            {...rest}
        >
            <Row>
                <Label>{c('Label').t`Address`}</Label>
                <div className="relative pt-2 text-ellipsis max-w100" title={address.Email}>
                    {address.Email}
                </div>
            </Row>
            <Row>
                <Label>{c('Label').t`Display name`}</Label>
                <Field>
                    <Input
                        value={model.displayName}
                        placeholder={c('Placeholder').t`Choose display name`}
                        onChange={handleDisplayName}
                    />
                </Field>
            </Row>
            <Row>
                <Editor
                    onReady={handleReady}
                    onChange={handleSignature}
                    simple
                    openEmojiPickerRef={openEmojiPickerRef}
                    toolbarConfig={toolbarConfig}
                    setToolbarConfig={setToolbarConfig}
                    modalLink={modalLink}
                    modalImage={modalImage}
                    modalDefaultFont={modalDefaultFont}
                />
            </Row>
        </FormModal>
    );
};

export default EditAddressModal;
