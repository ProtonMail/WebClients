import { useEffect, useRef } from 'react';

import { c } from 'ttag';

import { useGetAddressKeys } from '@proton/account/addressKeys/hooks';
import { useApi } from '@proton/app-context/useApi';
import { Href } from '@proton/atoms/Href/Href';
import { useCalendars } from '@proton/calendar/calendars/hooks';
import { useErrorHandler, useEventManager } from '@proton/components';
import { DRIVE_APP_NAME } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import useAvailableAddresses from '../../../../hooks/useAvailableAddresses';
import { IMPORT_ERROR, ImportProvider, ImportType } from '../../../../interface';
import { resetOauthDraft } from '../../../../logic/draft/oauthDraft/oauthDraft.actions';
import {
    selectOauthDraftProvider,
    selectOauthImportStateImporterData,
    selectOauthImportStateStep,
} from '../../../../logic/draft/oauthDraft/oauthDraft.selector';
import { useDriveSdk } from '../../../../logic/driveContext';
import { useEasySwitchDispatch, useEasySwitchSelector } from '../../../../logic/store';
import { createImporterTask } from '../StepLoading/useStepLoadingImporting.helpers';
import { DriveImportEmptyStep } from './DriveImportEmptyStep';
import { DriveImportGenericErrorStep } from './DriveImportGenericErrorStep';
import { DriveImportStorageWarningStep } from './DriveImportStorageWarningStep';
import { DriveStepModal } from './DriveStepModal';
import { TransferringIllustration } from './illustrations/TransferringIllustration';

/**
 * Drive only ever has one product, so this single modal covers gathering data, starting the
 * import task, and the final success message. It stays mounted across those steps (used for the
 * LoadingImporter, Prepare and Success slots) so the illustration keeps playing instead of
 * blinking closed/reopen - OAuthModal.tsx unmounts/remounts whenever the rendered component type
 * changes between steps.
 */
export const DriveImportProcessModal = () => {
    const dispatch = useEasySwitchDispatch();
    const step = useEasySwitchSelector(selectOauthImportStateStep);
    const provider = useEasySwitchSelector(selectOauthDraftProvider);
    const importerData = useEasySwitchSelector(selectOauthImportStateImporterData);
    const api = useApi();
    const [calendars = []] = useCalendars();
    const getAddressKeys = useGetAddressKeys();
    const errorHandler = useErrorHandler();
    const { call } = useEventManager();
    const driveClient = useDriveSdk();
    const { availableAddresses = [] } = useAvailableAddresses();

    const hasStartedImport = useRef(false);

    const driveError = importerData?.drive?.error;
    // Not enough storage --> still start the import, the user is only warned. The backend pauses it once the quota is reached.
    const hasStorageWarning = driveError?.code === IMPORT_ERROR.TOO_SHORT;

    useEffect(() => {
        if (
            hasStartedImport.current ||
            step !== 'prepare-import' ||
            !importerData ||
            (driveError && !hasStorageWarning)
        ) {
            return;
        }
        hasStartedImport.current = true;

        void createImporterTask({
            isLabelMapping: provider === ImportProvider.GOOGLE,
            products: [ImportType.DRIVE],
            importerData,
            api,
            driveClient,
            getAddressKeys,
            dispatch,
            availableAddresses,
            calendars,
            call,
            errorHandler,
            setIsCreatingCalendar: () => {},
            setIsCreatingImportTask: () => {},
            setCalendarsToBeCreated: () => {},
            increaseCalendarCount: () => {},
        });
    }, [step, importerData]);

    const handleClose = () => {
        dispatch(resetOauthDraft());
    };

    const isDone = step === 'success';
    const blockingError = step === 'prepare-import' && !hasStorageWarning ? driveError : undefined;

    if (isDone && hasStorageWarning) {
        return <DriveImportStorageWarningStep />;
    } else if (blockingError?.code === IMPORT_ERROR.NOT_EXISTS) {
        return <DriveImportEmptyStep />;
    } else if (blockingError) {
        return <DriveImportGenericErrorStep message={blockingError.message} onClose={handleClose} />;
    }

    return (
        <DriveStepModal
            onClose={isDone ? handleClose : undefined}
            closeDisabled={!isDone}
            media={<TransferringIllustration />}
            primaryAction={{ label: c('Action').t`Got it`, onClick: handleClose, disabled: !isDone }}
        >
            <h3 className="text-bold">{isDone ? c('Title').t`Import started` : c('Title').t`Preparing your import`}</h3>
            <p className="color-weak mt-2 mb-0">
                {isDone
                    ? c('Info')
                          .t`We'll email you when your import is complete. Your files will appear in a folder in ${DRIVE_APP_NAME}.`
                    : c('Info').t`Connecting to Google Drive and preparing your import.`}
            </p>
            {isDone && (
                <p className="mt-2 mb-0">
                    <Href href={getKnowledgeBaseUrl('/import-files-google-drive')}>{c('Link').t`Learn more`}</Href>
                </p>
            )}
        </DriveStepModal>
    );
};
