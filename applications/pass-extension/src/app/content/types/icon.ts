import type { AppStatus, Maybe } from '@proton/pass/types';

export type IconHandleState = { timer: Maybe<NodeJS.Timeout>; loading: boolean };
export interface FieldIconHandle {
    element: HTMLElement;
    detach: () => void;
    reposition: (reflow: boolean) => void;
    setCount: (count: number) => void;
    setStatus: (status: AppStatus) => void;
}
