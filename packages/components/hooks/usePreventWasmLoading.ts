import { useEffect } from 'react';

import { TelemetryMeasurementGroups, TelemetryPreventWasmLoading } from '@proton/shared/lib/api/telemetry';
import { sendTelemetryReport } from '@proton/shared/lib/helpers/metrics';
import { getItem, setItem } from '@proton/shared/lib/helpers/storage';
import { useFlag } from '@proton/unleash/useFlag';

import { useSilentApi } from './useSilentApi';

const STORAGE_KEY = 'wasm-telemetry-reported';

// Tries to compile a minimal valid WASM module to detect CSP blocks or policy restrictions.
const detectWasmStatus = async (): Promise<TelemetryPreventWasmLoading> => {
    if (typeof WebAssembly === 'undefined') {
        return TelemetryPreventWasmLoading.wasm_unsupported;
    }
    try {
        // Smallest valid WASM binary: 4-byte magic number "\0asm" + 4-byte version (1 in little-endian).
        // No functions or imports — just enough for the browser to attempt compilation.
        // Succeeds normally, throws if WASM is blocked by CSP, a browser extension, or an enterprise policy.
        await WebAssembly.compile(new Uint8Array([0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00]));
        return TelemetryPreventWasmLoading.wasm_loading;
    } catch {
        return TelemetryPreventWasmLoading.wasm_failed;
    }
};

export const usePreventWasmLoading = () => {
    const logWasmLoadingDisabled = useFlag('LogWasmLoadingDisabled');
    const silentApi = useSilentApi();

    useEffect(() => {
        // Send an event once per device
        if (getItem(STORAGE_KEY) || logWasmLoadingDisabled) {
            return;
        }

        void (async () => {
            const event = await detectWasmStatus();
            void sendTelemetryReport({
                api: silentApi,
                measurementGroup: TelemetryMeasurementGroups.preventWasmLoading,
                event,
                delay: false,
            });
            setItem(STORAGE_KEY, 'true');
        })();
    }, [logWasmLoadingDisabled]);
};
