import { useState } from 'react';

import type { EasySwitchFeatureFlag } from '@proton/activation/src/interface';
import { ImportProvider, ImportType } from '@proton/activation/src/interface';
import {
    changeOAuthStep,
    displayConfirmLeaveModal,
    submitProducts,
} from '@proton/activation/src/logic/draft/oauthDraft/oauthDraft.actions';
import {
    selectOauthDraftProvider,
    selectOauthImportStateImporterData,
    selectOauthImportStateProducts,
} from '@proton/activation/src/logic/draft/oauthDraft/oauthDraft.selector';
import { useEasySwitchDispatch, useEasySwitchSelector } from '@proton/activation/src/logic/store';
import { useCalendars, useFolders, useLabels, useUser } from '@proton/components';
import { FeatureCode, useFeature } from '@proton/features';
import { getVisualCalendars } from '@proton/shared/lib/calendar/calendar';
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

    const [user] = useUser();
    const [labels = []] = useLabels();
    const [folders = []] = useFolders();
    const [calendars = []] = useCalendars();
    const visualCalendars = getVisualCalendars(calendars);

    const emailSelected = products.includes(ImportType.MAIL);
    const contactSelected = products.includes(ImportType.CONTACTS);
    const calendarSelected = products.includes(ImportType.CALENDAR);

    const emailsHasError = !!importerData.emails?.error;
    const contactsHasError = !!importerData.contacts?.error;
    const calendarsHasError = !!importerData.calendars?.error;

    const [emailChecked, setEmailChecked] = useState(emailSelected && !emailsHasError);
    const [contactChecked, setContactChecked] = useState(contactSelected && !contactsHasError);
    const [calendarChecked, setCalendarChecked] = useState(calendarSelected && !calendarsHasError);

    const isLabelMapping = provider === ImportProvider.GOOGLE;

    const emailTitle = getMailCustomLabel(importerData.emails?.fields?.importPeriod);
    const hasErrors = importerHasErrors(
        products,
        importerData,
        labels,
        folders,
        visualCalendars,
        emailChecked,
        calendarChecked,
        isLabelMapping,
        !user.hasPaidMail
    );

    const easySwitchFeature = useFeature<EasySwitchFeatureFlag>(FeatureCode.EasySwitch);
    const featureMap = easySwitchFeature.feature!.Value;

    const handleSubmit = () => {
        const products = [
            emailChecked && ImportType.MAIL,
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
        emailChecked,
        setEmailChecked,
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
        allCheckboxUnselected: !emailChecked && !contactChecked && !calendarChecked,
    };
};

export default useStepPrepare;
