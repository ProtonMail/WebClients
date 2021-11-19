import { useState, MutableRefObject } from 'react';
import {
    generateUID,
    useAddresses,
    useMailSettings,
    SelectTwo,
    Option,
    Icon,
    SettingsLink,
    useUser,
} from '@proton/components';
import { c } from 'ttag';
import { APPS } from '@proton/shared/lib/constants';
import { SelectChangeEvent } from '@proton/components/components/selectTwo/select';
import { MessageExtended } from '../../../models/message';
import { getAddressFromEmail, getFromAddresses } from '../../../helpers/addresses';
import { MessageChange } from '../Composer';
import { changeSignature } from '../../../helpers/message/messageSignature';

interface Props {
    message: MessageExtended;
    disabled: boolean;
    onChange: MessageChange;
    onChangeContent: (content: string, refreshContent: boolean) => void;
    addressesBlurRef: MutableRefObject<() => void>;
}

const SelectSender = ({ message, disabled, onChange, onChangeContent, addressesBlurRef }: Props) => {
    const [mailSettings = {}] = useMailSettings();
    const [addresses = []] = useAddresses();
    const [user] = useUser();

    const [uid] = useState(generateUID('select-sender'));

    const addressesOptions = getFromAddresses(addresses, message.originalTo).map((address) => (
        <Option value={address.Email} title={address.Email} key={address.Email}>
            <span className="inline-flex flex-nowrap flex-row flex-align-items-center max-w100">
                <span className="text-ellipsis">{address.Email}</span>
                <Icon name="angle-down" className="select--inline-caret-option flex-item-noshrink ml0-5" />
            </span>
        </Option>
    ));

    if (user.hasPaidMail) {
        addressesOptions.push(
            <div key="create-new-adress" className="pl1 pt0-5 pb0-5 border-top">
                <SettingsLink path="/identity-addresses#addresses" app={APPS.PROTONMAIL}>
                    {c('Label').t`Manage my addresses`}
                </SettingsLink>
            </div>
        );
    }

    const handleFromChange = (event: SelectChangeEvent<string>) => {
        const email = event.value;

        const currentAddress = getAddressFromEmail(addresses, message.data?.Sender.Address);
        const newAddress = getAddressFromEmail(addresses, email);
        const Sender = newAddress ? { Name: newAddress.DisplayName, Address: email } : undefined;

        onChange({ data: { AddressID: newAddress?.ID, Sender } });
        onChangeContent(
            changeSignature(message, mailSettings, currentAddress?.Signature || '', newAddress?.Signature || ''),
            true
        );
    };

    return (
        <>
            <SelectTwo
                disabled={disabled}
                className="field-lighter select--inline-caret composer-meta-select-sender"
                id={`sender-${uid}`}
                value={message.data?.Sender?.Address}
                onChange={handleFromChange}
                onFocus={addressesBlurRef.current}
                noMaxWidth={false}
                originalPlacement="bottom-left"
                data-testid="composer:from"
            >
                {addressesOptions}
            </SelectTwo>
        </>
    );
};

export default SelectSender;
