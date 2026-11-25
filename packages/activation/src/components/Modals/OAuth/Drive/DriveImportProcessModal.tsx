import { useEffect, useRef } from 'react';

import { c } from 'ttag';

import { useGetAddressKeys } from '@proton/account/addressKeys/hooks';
import { useApi } from '@proton/app-context/useApi';
import { Href } from '@proton/atoms/Href/Href';
import { useCalendars } from '@proton/calendar/calendars/hooks';
import useErrorHandler from '@proton/components/hooks/useErrorHandler';
import useEventManager from '@proton/components/hooks/useEventManager';
import { IcArrowsRotate } from '@proton/icons/icons/IcArrowsRotate';
import { IcEnvelopeDot } from '@proton/icons/icons/IcEnvelopeDot';
import { IcFolder } from '@proton/icons/icons/IcFolder';
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
import { EasySwitchStepFeatureList } from '../../EasySwitchStepModal/EasySwitchStepFeatureList';
import { EasySwitchStepModal } from '../../EasySwitchStepModal/EasySwitchStepModal';
import { createImporterTask } from '../StepLoading/useStepLoadingImporting.helpers';
import { DriveImportEmptyStep } from './DriveImportEmptyStep';
import { DriveImportGenericErrorStep } from './DriveImportGenericErrorStep';
import { DriveImportStorageWarningStep } from './DriveImportStorageWarningStep';
import { DRIVE_IMPORT_STEPS } from './driveImportSteps';
import { TransferringIllustration } from './illustrations/TransferringIllustration';

/**
 * Drive only ever has one product, so this single modal covers gathering data, starting the
 * import task, and the final success message. DriveImportFlow renders it for every step after
 * 'instructions', so it stays mounted from 'loading-importer' to 'success': the import task is
 * started once and the illustration keeps playing instead of restarting.
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
            provider,
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
        <EasySwitchStepModal
            step={isDone ? DRIVE_IMPORT_STEPS.started : DRIVE_IMPORT_STEPS.preparing}
            onClose={handleClose}
            closeDisabled={!isDone}
            media={<TransferringIllustration />}
            primaryAction={{ label: c('Action').t`Got it`, onClick: handleClose, disabled: !isDone }}
            title={isDone ? c('Title').t`Import started` : c('Title').t`Preparing your import`}
        >
            <p className="color-weak m-0">
                {isDone
                    ? c('Info').t`We're copying your files from Google Drive to ${DRIVE_APP_NAME}.`
                    : c('Info').t`Connecting to Google Drive and preparing your import.`}
            </p>
            {isDone && (
                <>
                    <p className="mt-2 mb-6">
                        <Href href={getKnowledgeBaseUrl('/import-files-google-drive')}>{c('Link').t`Learn more`}</Href>
                    </p>
                    <EasySwitchStepFeatureList
                        items={[
                            {
                                icon: <IcArrowsRotate />,
                                title: c('Info').t`Runs in the background`,
                                description: c('Info').t`You can close this and keep using ${DRIVE_APP_NAME}.`,
                            },
                            {
                                icon: <IcFolder />,
                                title: c('Info').t`Find your files`,
                                description: c('Info').t`They'll be in a new folder in My files.`,
                            },
                            {
                                icon: <IcEnvelopeDot />,
                                title: c('Info').t`Know when it's done`,
                                description: c('Info').t`We'll email you when your import is complete.`,
                            },
                        ]}
                    />
                </>
            )}
        </EasySwitchStepModal>
    );
};
