import { WorkerStatus } from '@proton/pass/types';

import { DropdownAction } from './dropdown';

export interface FieldIconHandles {
    element: HTMLElement;
    setStatus: (status: WorkerStatus) => void;
    setLoading: (loading: boolean) => void;
    setCount: (count: number) => void;
    setOnClickAction: (action: DropdownAction) => void;
    detach: () => void;
}
