import useFlag from '@proton/unleash/useFlag';

export function useFlagsDriveSheetODSImport() {
    const isODSImportEnabled = useFlag('SheetsODSImportEnabled');
    return isODSImportEnabled;
}
