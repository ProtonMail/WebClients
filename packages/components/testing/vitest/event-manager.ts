import { vi } from 'vitest';

import type { EventManager } from '@proton/shared/lib/eventManager/eventManager';

export const mockEventManager: EventManager<any> = {
    call: vi.fn().mockReturnValue(Promise.resolve()),
    setEventID: vi.fn(),
    getEventID: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    reset: vi.fn(),
    subscribe: vi.fn(),
};
