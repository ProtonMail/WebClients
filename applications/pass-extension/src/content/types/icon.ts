import { type Maybe, type MaybeNull, WorkerStatus } from '@proton/pass/types';

import { DropdownAction } from './dropdown';

export type IconHandleState = { timer: Maybe<NodeJS.Timeout>; loading: boolean; action: MaybeNull<DropdownAction> };

export interface FieldIconHandle {
    element: HTMLElement;
    setStatus: (status: WorkerStatus) => void;
    setLoading: (loading: boolean) => void;
    setCount: (count: number) => void;
    setAction: (action: DropdownAction) => void;
    detach: () => void;
}
