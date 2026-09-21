import isEnumValue from '@proton/utils/isEnumValue';

import { EventNotifierEventName, EventNotifierLoopType, type EventNotifierMessage } from './interface';

const asRecord = (value: unknown): Record<string, unknown> | undefined => {
    if (typeof value !== 'string') {
        return undefined;
    }
    try {
        const parsed = JSON.parse(value);
        return !!parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : undefined;
    } catch (error) {
        return undefined;
    }
};

const asLoopType = (value: unknown) => {
    return typeof value === 'string' && isEnumValue(value, EventNotifierLoopType) ? value : undefined;
};

/**
 * Parses one SSE frame, `name` being its `event` field and `data` its `data` field.
 *
 * Everything received on the connection is untrusted input that must never surface to the user,
 * so unknown or malformed frames are dropped by returning `undefined` instead of throwing.
 */
export const parseEventNotifierMessage = (name: string, data: unknown): EventNotifierMessage | undefined => {
    switch (name) {
        case EventNotifierEventName.Hello: {
            const id = asRecord(data)?.id;
            return typeof id === 'string' && !!id ? { event: EventNotifierEventName.Hello, data: { id } } : undefined;
        }
        case EventNotifierEventName.Ping: {
            const payload = asRecord(data);
            const type = asLoopType(payload?.type);
            const identifier = typeof payload?.identifier === 'string' ? payload?.identifier : '';
            return type
                ? {
                      event: EventNotifierEventName.Ping,
                      data: { type, identifier },
                  }
                : undefined;
        }
        case EventNotifierEventName.Goodbye: {
            return { event: EventNotifierEventName.Goodbye };
        }
        case EventNotifierEventName.Error: {
            return typeof data === 'string' ? { event: EventNotifierEventName.Error, data } : undefined;
        }
    }
};
