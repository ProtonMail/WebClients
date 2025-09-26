import type { WasmAccountSyncer } from '@proton/andromeda';
import * as WasmModule from '@proton/andromeda';

export const mockWasmAccountSyncer = (mockedValue?: Partial<Pick<WasmAccountSyncer, 'fullSync' | 'partialSync'>>) => {
    const spy = vi.spyOn(WasmModule, 'WasmAccountSyncer');

    spy.mockReturnValue({
        fullSync: vi.fn(),
        partialSync: vi.fn(),
        shouldSync: vi.fn(),
        free: vi.fn(),
        [Symbol.dispose]: vi.fn(),
        ...mockedValue,
    });

    return spy;
};
