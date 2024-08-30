import { useEffect, useState } from 'react';

import useAvailableAddresses from '@proton/activation/src/hooks/useAvailableAddresses';
import { ImportProvider } from '@proton/activation/src/interface';
import {
    selectOauthDraftProvider,
    selectOauthImportStateImporterData,
    selectOauthImportStateProducts,
} from '@proton/activation/src/logic/draft/oauthDraft/oauthDraft.selector';
import { useEasySwitchDispatch, useEasySwitchSelector } from '@proton/activation/src/logic/store';
import { useApi, useCalendars, useErrorHandler, useEventManager, useGetAddressKeys } from '@proton/components';

import { createImporterTask } from './useStepLoadingImporting.helpers';

const useStepLoadingImporting = () => {
    const api = useApi();
    const [calendars = []] = useCalendars();
    const getAddressKeys = useGetAddressKeys();
    const errorHandler = useErrorHandler();
    const { call } = useEventManager();

    const dispatch = useEasySwitchDispatch();

    const { availableAddresses = [] } = useAvailableAddresses();

    const [calendarsToBeCreated, setCalendarsToBeCreated] = useState<number>(0);
    const [createdCalendarCount, setCreatedCalendarCount] = useState(0);
    const [isCreatingCalendar, setIsCreatingCalendar] = useState(false);
    const [isCreatingImportTask, setIsCreatingImportTask] = useState(false);

    const importerData = useEasySwitchSelector(selectOauthImportStateImporterData);
    const products = useEasySwitchSelector(selectOauthImportStateProducts);
    const provider = useEasySwitchSelector(selectOauthDraftProvider);

    if (!importerData || !products || !provider) {
        throw new Error('Importer data, provider and products should be defined');
    }

    const isLabelMapping = provider === ImportProvider.GOOGLE;

    useEffect(() => {
        void createImporterTask({
            isLabelMapping,
            products,
            importerData,
            api,
            dispatch,
            getAddressKeys,
            availableAddresses,
            calendars,
            call,
            errorHandler,
            setIsCreatingCalendar,
            setIsCreatingImportTask,
            setCalendarsToBeCreated,
            increaseCalendarCount: () => {
                setCreatedCalendarCount((state) => state + 1);
            },
        });
    }, []);

    return {
        createdCalendarCount,
        calendarsToBeCreated,
        isCreatingCalendar,
        isCreatingImportTask,
    };
};

export default useStepLoadingImporting;
