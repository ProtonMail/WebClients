import { useState } from 'react';

import type { EasySwitchFeatureFlag } from '@proton/activation/src/interface';
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
import { FeatureCode, useFeature } from '@proton/features';

import { getEnabledFeature } from '../OAuthModal.helpers';
import { getScopeFromProvider } from './useStepProducts.helpers';

interface Props {
    triggerOAuth: (scopes: string[]) => void;
}

const useStepProducts = ({ triggerOAuth }: Props) => {
    const dispatch = useEasySwitchDispatch();
    const products = useEasySwitchSelector(selectOauthImportStateProducts);
    const provider = useEasySwitchSelector(selectOauthDraftProvider);

    if (!products || !provider) {
        throw new Error('products and provider must be defined');
    }

    const easySwitchFeature = useFeature<EasySwitchFeatureFlag>(FeatureCode.EasySwitch);
    const featureMap = easySwitchFeature.feature!.Value;

    const [mailChecked, setMailChecked] = useState(products.includes(ImportType.MAIL) ?? false);
    const [contactChecked, setContactChecked] = useState(products.includes(ImportType.CONTACTS) ?? false);
    const [calendarChecked, setCalendarChecked] = useState(products.includes(ImportType.CALENDAR) ?? false);

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
        enabledFeatures: getEnabledFeature(provider, featureMap),
    };
};

export default useStepProducts;
