import { MutableRefObject, useState } from 'react';

import { c } from 'ttag';

import { Icon, Option, SelectTwo, SettingsLink, generateUID, useAddresses, useUser } from '@proton/components';
import { SelectChangeEvent } from '@proton/components/components/selectTwo/select';
import { APPS } from '@proton/shared/lib/constants';

import { getFromAddresses } from '../../../helpers/addresses';
import { selectComposer } from '../../../logic/composers/composerSelectors';
import { ComposerID } from '../../../logic/composers/composerTypes';
import { composerActions } from '../../../logic/composers/composersSlice';
import { MessageState } from '../../../logic/messages/messagesTypes';
import { useAppDispatch, useAppSelector } from '../../../logic/store';

interface Props {
    composerID: ComposerID;
    message: MessageState;
    disabled: boolean;
    onChangeContent: (content: string, refreshContent: boolean) => void;
    addressesBlurRef: MutableRefObject<() => void>;
}

const SelectSender = ({ composerID, message, disabled, addressesBlurRef }: Props) => {
    const [addresses = []] = useAddresses();
    const [user] = useUser();

    const dispatch = useAppDispatch();
    const composer = useAppSelector((state) => selectComposer(state, composerID));

    const [uid] = useState(generateUID('select-sender'));

    const addressesOptions = getFromAddresses(
        addresses,
        message.draftFlags?.originalTo || message.draftFlags?.originalFrom || message.data?.Sender?.Address
    ).map((address) => (
        <Option
            value={address.Email}
            title={address.Email}
            key={address.Email}
            data-testid={`addresses:${address.Email}`}
        >
            <span className="inline-flex flex-nowrap flex-row flex-align-items-center max-w100">
                <span className="text-ellipsis">{address.Email}</span>
                <Icon name="chevron-down" className="select--inline-caret-option flex-item-noshrink ml-2" />
            </span>
        </Option>
    ));

    if (user.hasPaidMail) {
        addressesOptions.push(
            <div key="create-new-adress" className="pl-4 py-2 border-top">
                <SettingsLink path="/identity-addresses#addresses" app={APPS.PROTONMAIL}>
                    {c('Label').t`Manage my addresses`}
                </SettingsLink>
            </div>
        );
    }

    const handleFromChange = (event: SelectChangeEvent<string>) => {
        const email = event.value;
        dispatch(composerActions.setSender({ ID: composerID, emailAddress: email }));
    };

    return (
        <>
            <SelectTwo
                disabled={disabled}
                className="composer-light-field select--inline-caret composer-meta-select-sender"
                id={`sender-${uid}`}
                value={composer.senderEmailAddress}
                onChange={handleFromChange}
                onFocus={addressesBlurRef.current}
                originalPlacement="bottom-start"
                data-testid="composer:from"
            >
                {addressesOptions}
            </SelectTwo>
        </>
    );
};

export default SelectSender;
