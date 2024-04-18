import type { AppStatus } from '@proton/pass/types';
import { type Maybe } from '@proton/pass/types';

export type IconHandleState = { timer: Maybe<NodeJS.Timeout>; loading: boolean };
export interface FieldIconHandle {
    element: HTMLElement;
    setStatus: (status: AppStatus) => void;
    setCount: (count: number) => void;
    detach: () => void;
    reposition: (revalidate?: boolean) => void;
}
