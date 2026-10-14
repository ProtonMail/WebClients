import { tracker } from '@proton/telemetry-tracker/tracker';

import type { ApiImportProvider } from '../api/api.interface';
import type { ImportType } from '../interface';
import { telemetryProduct, telemetryProvider } from '../telemetry/dimensions';
import type { ImportAction } from '../telemetry/events';
import { easySwitchImportReportAction } from '../telemetry/events';
import { useGetIsBYOE } from './useGetIsBYOE';

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
        tracker.emit(easySwitchImportReportAction, {
            dimensions: {
                importAction,
                isBYOE,
                provider: telemetryProvider[provider],
                product: telemetryProduct[product],
            },
        });
    };
};
