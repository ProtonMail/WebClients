import { useEffect, useState } from 'react';

import { useGetAddressKeys } from '@proton/account/addressKeys/hooks';
import { useApi } from '@proton/app-context/useApi';
import { useCalendars } from '@proton/calendar/calendars/hooks';
import { useErrorHandler, useEventManager } from '@proton/components';

import useAvailableAddresses from '../../../../hooks/useAvailableAddresses';
import { ImportProvider } from '../../../../interface';
import {
    selectOauthDraftProvider,
    selectOauthImportStateImporterData,
    selectOauthImportStateProducts,
} from '../../../../logic/draft/oauthDraft/oauthDraft.selector';
import { useDriveSdk } from '../../../../logic/driveContext';
import { useEasySwitchDispatch, useEasySwitchSelector } from '../../../../logic/store';
import { createImporterTask } from './useStepLoadingImporting.helpers';

const useStepLoadingImporting = () => {
    const api = useApi();
    const [calendars = []] = useCalendars();
    const getAddressKeys = useGetAddressKeys();
    const errorHandler = useErrorHandler();
    const { call } = useEventManager();
    const drive = useDriveSdk();

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
            driveClient: drive,
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
