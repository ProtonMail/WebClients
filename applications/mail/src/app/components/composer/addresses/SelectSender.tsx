import type { MutableRefObject } from 'react';
import { useState } from 'react';

import { DropdownSizeUnit, SelectTwo } from '@proton/components';
import type { SelectChangeEvent } from '@proton/components/components/selectTwo/select';
import type { MessageState } from '@proton/mail/store/messages/messagesTypes';
import generateUID from '@proton/utils/generateUID';

import useGetSenderOptions from 'proton-mail/hooks/composer/useGetSenderOptions';
import { useMailDispatch, useMailSelector } from 'proton-mail/store/hooks';

import { selectComposer } from '../../../store/composers/composerSelectors';
import type { ComposerID } from '../../../store/composers/composerTypes';
import { composerActions } from '../../../store/composers/composersSlice';

interface Props {
    composerID: ComposerID;
    message: MessageState;
    disabled: boolean;
    addressesBlurRef: MutableRefObject<() => void>;
}

const SelectSender = ({ composerID, message, disabled, addressesBlurRef }: Props) => {
    const dispatch = useMailDispatch();
    const composer = useMailSelector((state) => selectComposer(state, composerID));

    const [uid] = useState(generateUID('select-sender'));

    const addressesOptions = useGetSenderOptions(message);

    const handleFromChange = (event: SelectChangeEvent<string>) => {
        const email = event.value;
        dispatch(composerActions.setSender({ ID: composerID, emailAddress: email }));
    };

    return (
        <SelectTwo
            disabled={disabled}
            className="composer-light-field select--inline-caret composer-meta-select-sender expand-click-area"
            id={`sender-${uid}`}
            value={composer?.senderEmailAddress}
            onChange={handleFromChange}
            onFocus={addressesBlurRef.current}
            originalPlacement="bottom-start"
            data-testid="composer:from"
            size={{
                width: DropdownSizeUnit.Dynamic,
            }}
        >
            {addressesOptions}
        </SelectTwo>
    );
};

export default SelectSender;
