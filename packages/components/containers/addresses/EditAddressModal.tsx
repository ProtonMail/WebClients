import React, { ChangeEvent, useState } from 'react';
import { c } from 'ttag';
import {
    FormModal,
    Row,
    Field,
    Label,
    Input,
    RichTextEditor,
    useApi,
    useLoading,
    useNotifications,
    useEventManager
} from '../../index';
import { updateAddress } from 'proton-shared/lib/api/addresses';
import { Address } from 'proton-shared/lib/interfaces';

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
        signature: address.Signature
    });
    const { createNotification } = useNotifications();

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
            submit={c('Action').t`Save`}
            loading={loading}
            {...rest}
        >
            <Row>
                <Label>{c('Label').t`Address`}</Label>
                <Field className="pt0-5">{address.Email}</Field>
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
                <Label>{c('Label').t`Signature`}</Label>
                <Field className="pm-field-container--full">
                    <RichTextEditor value={model.signature} onChange={handleSignature} />
                </Field>
            </Row>
        </FormModal>
    );
};

export default EditAddressModal;
