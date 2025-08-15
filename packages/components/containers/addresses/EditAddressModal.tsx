import type { ChangeEvent } from 'react';
import { useState } from 'react';

import { c } from 'ttag';

import { addressThunk } from '@proton/account/addresses';
import Field from '@proton/components/components/container/Field';
import Row from '@proton/components/components/container/Row';
import Editor from '@proton/components/components/editor/Editor';
import { useToolbar } from '@proton/components/components/editor/hooks/useToolbar';
import type { EditorActions } from '@proton/components/components/editor/interface';
import Input from '@proton/components/components/input/Input';
import Label from '@proton/components/components/label/Label';
import FormModal from '@proton/components/components/modal/FormModal';
import useApi from '@proton/components/hooks/useApi';
import useNotifications from '@proton/components/hooks/useNotifications';
import { useLoading } from '@proton/hooks';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { CacheType } from '@proton/redux-utilities';
import { updateAddress } from '@proton/shared/lib/api/addresses';
import type { Address } from '@proton/shared/lib/interfaces';

const EMPTY_VALUES = [/^(<div><br><\/div>)+$/, /^(<div>\s*<\/div>)+$/];

const formatSignature = (value: string) => (EMPTY_VALUES.some((regex) => regex.test(value)) ? '' : value);

interface Props {
    onClose?: () => void;
    address: Address;
}
const EditAddressModal = ({ onClose, address, ...rest }: Props) => {
    const api = useApi();
    const dispatch = useDispatch();
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
        await dispatch(addressThunk({ address, cache: CacheType.None }));
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
                <div className="relative pt-2 text-ellipsis max-w-full" title={address.Email}>
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
