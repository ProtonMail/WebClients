import { ChangeEvent, useState, useRef } from 'react';
import { c } from 'ttag';
import { updateAddress } from '@proton/shared/lib/api/addresses';
import { Address } from '@proton/shared/lib/interfaces';
import { FormModal, Row, Field, Label, Input, SimpleSquireEditor } from '../../components';
import { useApi, useLoading, useNotifications, useEventManager } from '../../hooks';
import { SquireEditorRef } from '../../components/editor/SquireEditor';

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
    const editorRef = useRef<SquireEditorRef>(null);

    const handleReady = () => {
        if (editorRef.current) {
            editorRef.current.value = model.signature;
        }
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
                <div className="relative pt0-5 text-ellipsis max-w100" title={address.Email}>
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
                <SimpleSquireEditor ref={editorRef} onReady={handleReady} onChange={handleSignature} />
            </Row>
        </FormModal>
    );
};

export default EditAddressModal;
