import { useState } from 'react';

import { useAddresses } from '@proton/account/addresses/hooks';
import { ImportProvider, ImportType } from '@proton/activation/src/interface';
import {
    changeOAuthStep,
    displayConfirmLeaveModal,
    resetOauthDraft,
    submitProductProvider,
} from '@proton/activation/src/logic/draft/oauthDraft/oauthDraft.actions';
import {
    selectOauthDraftProvider,
    selectOauthImportStateProducts,
} from '@proton/activation/src/logic/draft/oauthDraft/oauthDraft.selector';
import { useEasySwitchDispatch, useEasySwitchSelector } from '@proton/activation/src/logic/store';
import { getIsBYOEOnlyAccount } from '@proton/shared/lib/helpers/address';

import { getScopeFromProvider } from './useStepProducts.helpers';

interface Props {
    triggerOAuth: (scopes: string[]) => void;
}

const useStepProducts = ({ triggerOAuth }: Props) => {
    const dispatch = useEasySwitchDispatch();
    const [addresses] = useAddresses();
    const isBYOEAccount = getIsBYOEOnlyAccount(addresses);
    const products = useEasySwitchSelector(selectOauthImportStateProducts);
    const provider = useEasySwitchSelector(selectOauthDraftProvider);

    if (!products || !provider) {
        throw new Error('products and provider must be defined');
    }

    const [mailChecked, setMailChecked] = useState(products.includes(ImportType.MAIL) ?? false);
    const [contactChecked, setContactChecked] = useState(products.includes(ImportType.CONTACTS) ?? false);
    const [calendarChecked, setCalendarChecked] = useState(
        (products.includes(ImportType.CALENDAR) && !isBYOEAccount) ?? false
    );

    const handleCancel = () => {
        dispatch(displayConfirmLeaveModal(false));
        dispatch(resetOauthDraft());
    };

    const handleSubmit = () => {
        const products = [];
        if (mailChecked) {
            products.push(ImportType.MAIL);
        }
        if (contactChecked) {
            products.push(ImportType.CONTACTS);
        }
        if (calendarChecked) {
            products.push(ImportType.CALENDAR);
        }

        const scopes = getScopeFromProvider(provider, products);
        dispatch(submitProductProvider({ products, scopes }));

        if (provider === ImportProvider.OUTLOOK) {
            triggerOAuth(scopes);
        } else if (provider === ImportProvider.GOOGLE) {
            dispatch(changeOAuthStep('instructions'));
        }
    };

    const nextDisabled = !mailChecked && !contactChecked && !calendarChecked;

    return {
        mailChecked,
        setMailChecked,
        contactChecked,
        setContactChecked,
        calendarChecked,
        setCalendarChecked,
        handleCancel,
        handleSubmit,
        nextDisabled,
        isBYOEOnlyAccount: isBYOEAccount,
    };
};

export default useStepProducts;
