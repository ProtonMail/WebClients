import type { ApiImportProvider } from '../api/api.interface';
import type { ImportType } from '../interface';
import { trackAccountImportReportAction } from '../telemetry/accountImportFlow';
import { telemetryProduct, telemetryProvider } from '../telemetry/dimensions';
import { useGetIsBYOE } from './useGetIsBYOE';

type ImportAction = 'cancel_import' | 'resume_import' | 'undo_import' | 'delete_report';

interface Props {
    account: string;
    provider: ApiImportProvider;
    product: ImportType;
}

/**
 * Returns a function emitting the import report action telemetry event for the given import.
 */
export const useTrackImportAction = ({ account, provider, product }: Props) => {
    const getIsBYOE = useGetIsBYOE();

    return async (importAction: ImportAction) => {
        const isBYOE = await getIsBYOE(account);
        trackAccountImportReportAction({
            action: importAction,
            isBYOE,
            provider: telemetryProvider[provider],
            product: telemetryProduct[product],
        });
    };
};
