import { defineConfig } from 'eslint/config';

import defaultConfig from '@proton/eslint-config-proton/all';
import { createRestrictedImportsConfig } from '@proton/eslint-config-proton/restrictedImports';

/**
 * Files still importing the bare `@proton/components` barrel. Only its `/index` specifiers are banned for them.
 * The barrel loads the whole components package: through these modals it cost every mail test file ~0.5s.
 * Remove files from this list as they move to full path imports, never add new ones.
 */
const legacyBarrelImporters = [
    'src/components/Modals/BYOESetupSuccessModal/BYOESetupSuccessModal.tsx',
    'src/components/Modals/BYOESyncLostModal/BYOESyncLostModal.tsx',
    'src/components/Modals/CustomizeMailImportModal/CustomizeMailImportModal.test.tsx',
    'src/components/Modals/CustomizeMailImportModal/CustomizeMailImportModal.tsx',
    'src/components/Modals/CustomizeMailImportModal/CustomizeMailImportModalAddresses.tsx',
    'src/components/Modals/CustomizeMailImportModal/CustomizeMailImportModalConfirmLeaveModal.tsx',
    'src/components/Modals/CustomizeMailImportModal/CustomizeMailImportModalCustomizeFoldersToggle.tsx',
    'src/components/Modals/CustomizeMailImportModal/CustomizeMailImportModalGmailCategories.tsx',
    'src/components/Modals/CustomizeMailImportModal/CustomizeMailImportModalLabel.tsx',
    'src/components/Modals/CustomizeMailImportModal/CustomizeMailImportModalPeriod.tsx',
    'src/components/Modals/CustomizeMailImportModal/ManageFolders/ManageFoldersRow/ManageFoldersRow.tsx',
    'src/components/Modals/CustomizeMailImportModal/ManageFolders/ManageFoldersRow/ManageFoldersRowInput.tsx',
    'src/components/Modals/DisconnectBYOEModal/DisconnectBYOEModal.tsx',
    'src/components/Modals/Imap/ImapMailModal/ProviderWrapper.tsx',
    'src/components/Modals/Imap/ImapMailModal/StepForm/hooks/useAuthInfoByEmail.ts',
    'src/components/Modals/Imap/ImapMailModal/StepForm/StepForm.tsx',
    'src/components/Modals/Imap/ImapMailModal/StepForm/StepFormErrorDefault.tsx',
    'src/components/Modals/Imap/ImapMailModal/StepForm/StepFormErrorYahoo.tsx',
    'src/components/Modals/Imap/ImapMailModal/StepImporting/StepImporting.tsx',
    'src/components/Modals/Imap/ImapMailModal/StepImporting/StepImportingContent.tsx',
    'src/components/Modals/Imap/ImapMailModal/StepPrepareImap/StepPrepareImap.tsx',
    'src/components/Modals/Imap/ImapMailModal/StepPrepareImap/StepPrepareImapContent.tsx',
    'src/components/Modals/Imap/ImapMailModal/StepPrepareImap/StepPrepareImapError.tsx',
    'src/components/Modals/Imap/ImapMailModal/StepPrepareImap/useStepPrepareImap.helpers.ts',
    'src/components/Modals/Imap/InstructionsModal/InstructionsModal.tsx',
    'src/components/Modals/OAuth/Drive/DriveImportProcessModal.tsx',
    'src/components/Modals/OAuth/Drive/illustrations/AuthorizationIllustration.tsx',
    'src/components/Modals/OAuth/Drive/illustrations/TransferDestinationErrorIllustration.tsx',
    'src/components/Modals/OAuth/Drive/illustrations/TransferFinishIllustration.tsx',
    'src/components/Modals/OAuth/Drive/illustrations/TransferLockIllustration.tsx',
    'src/components/Modals/OAuth/Drive/illustrations/TransferringIllustration.tsx',
    'src/components/Modals/OAuth/Drive/illustrations/TransferSourceErrorIllustration.tsx',
    'src/components/Modals/OAuth/StepInstructions/StepInstructionsGoogle.tsx',
    'src/components/Modals/OAuth/StepLoading/StepLoadingImporter.tsx',
    'src/components/Modals/OAuth/StepLoading/StepLoadingImporting.tsx',
    'src/components/Modals/OAuth/StepLoading/useStepLoadingImporting.ts',
    'src/components/Modals/OAuth/StepPrepareOAuth/CustomizeCalendarImportModal/CustomizeCalendarImportModal.test.tsx',
    'src/components/Modals/OAuth/StepPrepareOAuth/CustomizeCalendarImportModal/CustomizeCalendarImportModal.tsx',
    'src/components/Modals/OAuth/StepPrepareOAuth/CustomizeCalendarImportModal/CustomizeCalendarImportRow.tsx',
    'src/components/Modals/OAuth/StepPrepareOAuth/CustomizeCalendarImportModal/CustomizeCalendarImportRowSelect.tsx',
    'src/components/Modals/OAuth/StepPrepareOAuth/StepPrepareOAuth.tsx',
    'src/components/Modals/OAuth/StepPrepareOAuth/StepPrepareOAuthCalendarSummary.tsx',
    'src/components/Modals/OAuth/StepPrepareOAuth/StepPrepareOAuthDisabledCheckbox.tsx',
    'src/components/Modals/OAuth/StepPrepareOAuth/StepPrepareOAuthEmailsSummary.tsx',
    'src/components/Modals/OAuth/StepPrepareOAuth/StepPrepareOAuthEmailsSummaryText.tsx',
    'src/components/Modals/OAuth/StepProducts/StepProductsRowItem.tsx',
    'src/components/Modals/OAuth/StepSuccess/StepSuccess.tsx',
    'src/components/ReportsTable/Importers/ImporterRow.tsx',
    'src/components/ReportsTable/Importers/ImporterRowActions.tsx',
    'src/components/ReportsTable/ImportsTable.tsx',
    'src/components/ReportsTable/Organization/OrganizationImportRow.tsx',
    'src/components/ReportsTable/Reports/ReportRow.tsx',
    'src/components/ReportsTable/Reports/ReportRowActions.tsx',
    'src/components/ReportsTable/ReportsTableCell.tsx',
    'src/components/ReportsTable/Sync/BYOEAddressRow.tsx',
    'src/components/ReportsTable/Sync/SyncRow.tsx',
    'src/components/ReportsTable/Sync/SyncRowActions.tsx',
    'src/components/ReportsTable/SyncsTable.tsx',
    'src/components/SettingsArea/SettingsArea.tsx',
    'src/tests/render.tsx',
];

export default defineConfig([
    defaultConfig,
    createRestrictedImportsConfig({ rollout: ['components-barrel', 'icon-component'] }),
    // A second call for some `files` replaces the first call's options for those files, so repeat the rollout ids.
    createRestrictedImportsConfig({
        rollout: ['components-barrel-index', 'icon-component'],
        files: legacyBarrelImporters,
    }),
]);
