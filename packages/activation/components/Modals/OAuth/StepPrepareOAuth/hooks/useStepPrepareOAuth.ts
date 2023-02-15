import { useState } from 'react';

import { EasySwitchFeatureFlag, ImportProvider, ImportType } from '@proton/activation/interface';
import {
    changeOAuthStep,
    displayConfirmLeaveModal,
    submitProducts,
} from '@proton/activation/logic/draft/oauthDraft/oauthDraft.actions';
import {
    selectOauthDraftProvider,
    selectOauthImportStateImporterData,
    selectOauthImportStateProducts,
} from '@proton/activation/logic/draft/oauthDraft/oauthDraft.selector';
import { useEasySwitchDispatch, useEasySwitchSelector } from '@proton/activation/logic/store';
import { FeatureCode, useCalendars, useFeature, useFolders, useLabels } from '@proton/components/index';
import isTruthy from '@proton/utils/isTruthy';

import { getEnabledFeature } from '../../OAuthModal.helpers';
import { getMailCustomLabel, importerHasErrors } from './useStepPrepareOAuth.helpers';

const useStepPrepare = () => {
    const dispatch = useEasySwitchDispatch();

    const products = useEasySwitchSelector(selectOauthImportStateProducts);
    const provider = useEasySwitchSelector(selectOauthDraftProvider);
    const importerData = useEasySwitchSelector(selectOauthImportStateImporterData);

    if (!products || !importerData || !provider) {
        throw new Error('products or importerData must be defined');
    }

    const [labels = []] = useLabels();
    const [folders = []] = useFolders();
    const [calendars = []] = useCalendars();

    const [mailChecked, setMailChecked] = useState(products.includes(ImportType.MAIL));
    const [contactChecked, setContactChecked] = useState(products.includes(ImportType.CONTACTS));
    const [calendarChecked, setCalendarChecked] = useState(products.includes(ImportType.CALENDAR));

    const isLabelMapping = provider === ImportProvider.GOOGLE;

    const emailTitle = getMailCustomLabel(importerData.emails?.fields?.importPeriod);
    const hasErrors = importerHasErrors(
        products,
        importerData,
        labels,
        folders,
        calendars,
        mailChecked,
        calendarChecked,
        isLabelMapping
    );

    const easySwitchFeature = useFeature<EasySwitchFeatureFlag>(FeatureCode.EasySwitch);
    const featureMap = easySwitchFeature.feature!.Value;

    const handleSubmit = () => {
        const products = [
            mailChecked && ImportType.MAIL,
            contactChecked && ImportType.CONTACTS,
            calendarChecked && ImportType.CALENDAR,
        ].filter(isTruthy);

        dispatch(submitProducts(products));
        dispatch(changeOAuthStep('importing'));
    };

    const handleCancel = () => {
        dispatch(displayConfirmLeaveModal(true));
    };

    return {
        products,
        mailChecked,
        setMailChecked,
        contactChecked,
        setContactChecked,
        calendarChecked,
        setCalendarChecked,
        importerData,
        handleCancel,
        handleSubmit,
        emailTitle,
        hasErrors,
        enabledFeatures: getEnabledFeature(provider, featureMap),
        allCheckboxUnselected: !mailChecked && !contactChecked && !calendarChecked,
    };
};

export default useStepPrepare;
