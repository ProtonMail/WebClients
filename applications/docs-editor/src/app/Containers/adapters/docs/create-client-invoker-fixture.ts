import type { EditorRequiresClientMethods } from '@proton/docs-shared'
import { createStandaloneDocClient } from '../../../../standalone-doc/client'

/** The shell adapter still accepts the shared host bridge; the editor does not. */
export function createClientInvokerFixture(): EditorRequiresClientMethods {
  return {
    ...createStandaloneDocClient(jest.fn(), () => () => {}),
    editorRequestsPropagationOfUpdate: jest.fn(async () => {}),
    editorReportingEvent: jest.fn(async () => {}),
    editorReportingTelemetry: jest.fn(async () => {}),
    handleAwarenessStateUpdate: jest.fn(async () => {}),
    openLink: jest.fn(async () => {}),
    reportUserInterfaceError: jest.fn(async () => {}),
    reportWordCount: jest.fn(async () => {}),
    updateFrameSize: jest.fn(),
    showGenericAlertModal: jest.fn(),
    showGenericInfoModal: jest.fn(),
    fetchExternalImageAsBase64: jest.fn(async () => undefined),
    getAppPlatform: jest.fn(async () => 'web' as const),
    handleFileMenuAction: jest.fn(async () => {}),
    checkIfFeatureFlagIsEnabled: jest.fn(async () => false),
    reloadClient: jest.fn(async () => {}),
    storeSpreadsheetPatches: jest.fn(async () => {}),
    storeSpreadsheetAction: jest.fn(async () => {}),
    hasBasePatchesStored: jest.fn(async () => false),
    getDocumentUrl: jest.fn(async () => 'https://example.test/document'),
    replaceDocumentUrl: jest.fn(async () => {}),
    reportSheetsYjsDriftDetected: jest.fn(),
    showYjsDriftDetectedErrorModal: jest.fn(),
  }
}
