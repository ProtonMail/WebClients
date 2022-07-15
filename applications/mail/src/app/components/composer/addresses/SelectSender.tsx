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
    useUserSettings,
} from '@proton/components';
import { c } from 'ttag';
import { APPS } from '@proton/shared/lib/constants';
import { SelectChangeEvent } from '@proton/components/components/selectTwo/select';
import { defaultFontStyle } from '@proton/components/components/editor/helpers';
import { getAddressFromEmail, getFromAddresses } from '../../../helpers/addresses';
import { changeSignature } from '../../../helpers/message/messageSignature';
import { MessageState } from '../../../logic/messages/messagesTypes';
import { MessageChange } from '../Composer';

interface Props {
    message: MessageState;
    disabled: boolean;
    onChange: MessageChange;
    onChangeContent: (content: string, refreshContent: boolean) => void;
    addressesBlurRef: MutableRefObject<() => void>;
}

const SelectSender = ({ message, disabled, onChange, onChangeContent, addressesBlurRef }: Props) => {
    const [mailSettings] = useMailSettings();
    const [userSettings] = useUserSettings();
    const [addresses = []] = useAddresses();
    const [user] = useUser();

    const [uid] = useState(generateUID('select-sender'));

    const addressesOptions = getFromAddresses(addresses, message.draftFlags?.originalTo).map((address) => (
        <Option value={address.Email} title={address.Email} key={address.Email}>
            <span className="inline-flex flex-nowrap flex-row flex-align-items-center max-w100">
                <span className="text-ellipsis">{address.Email}</span>
                <Icon name="chevron-down" className="select--inline-caret-option flex-item-noshrink ml0-5" />
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

        const fontStyle = defaultFontStyle(mailSettings);

        onChange({ data: { AddressID: newAddress?.ID, Sender } });
        onChangeContent(
            changeSignature(
                message,
                mailSettings,
                userSettings,
                fontStyle,
                currentAddress?.Signature || '',
                newAddress?.Signature || ''
            ),
            true
        );
    };

    return (
        <>
            <SelectTwo
                disabled={disabled}
                className="composer-light-field select--inline-caret composer-meta-select-sender"
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
