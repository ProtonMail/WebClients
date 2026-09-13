import { useEffect, useRef } from 'react';

import { c } from 'ttag';

import { useGetAddressKeys } from '@proton/account/addressKeys/hooks';
import { useApi } from '@proton/app-context/useApi';
import { useCalendars } from '@proton/calendar/calendars/hooks';
import { VideoInstructions, useErrorHandler, useEventManager } from '@proton/components';
import { DRIVE_APP_NAME } from '@proton/shared/lib/constants';

import useAvailableAddresses from '../../../../hooks/useAvailableAddresses';
import { IMPORT_ERROR, ImportProvider, ImportType } from '../../../../interface';
import { resetOauthDraft, submitProducts } from '../../../../logic/draft/oauthDraft/oauthDraft.actions';
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
import transferringMp4 from './illustrations/transferring.mp4';
import transferringWebm from './illustrations/transferring.webm';

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

    useEffect(() => {
        if (hasStartedImport.current || step !== 'prepare-import' || !importerData || importerData.drive?.error) {
            return;
        }
        hasStartedImport.current = true;

        dispatch(submitProducts([ImportType.DRIVE]));

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

    const driveError = step === 'prepare-import' ? importerData?.drive?.error : undefined;

    if (driveError?.code === IMPORT_ERROR.TOO_SHORT) {
        return <DriveImportStorageWarningStep />;
    } else if (driveError?.code === IMPORT_ERROR.NOT_EXISTS) {
        return <DriveImportEmptyStep />;
    } else if (driveError) {
        return <DriveImportGenericErrorStep message={driveError.message} />;
    }

    const isDone = step === 'success';

    return (
        <DriveStepModal
            onClose={isDone ? handleClose : undefined}
            closeDisabled={!isDone}
            media={
                <VideoInstructions loop>
                    <source src={transferringWebm} type="video/webm" />
                    <source src={transferringMp4} type="video/mp4" />
                </VideoInstructions>
            }
            primaryAction={{ label: c('Action').t`Got it`, onClick: handleClose, disabled: !isDone }}
        >
            <h3 className="text-bold">
                {isDone ? c('Title').t`Your import is starting` : c('Title').t`Setting up your import`}
            </h3>
            <p className="color-weak mt-2 mb-0">
                {isDone
                    ? c('Info')
                          .t`We will email you when the import is done. Once finished you'll find your import in a folder.`
                    : c('Info').t`Connecting to Google Drive to setup your secure import to ${DRIVE_APP_NAME}.`}
            </p>
        </DriveStepModal>
    );
};
