import type { InlineToastAction } from '../../../constants.runtime';
import type { InlineToastRequest } from './toast.app';

export interface InlineToastHandler {
    attach: () => void;
    close: (action?: InlineToastAction) => void;
    destroy: () => void;
    open: (request: InlineToastRequest) => void;
}
