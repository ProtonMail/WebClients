import { useEventManager } from 'react-components';

import { Event } from '../../models/event';

export const eventManagerListeners: ((...args: any[]) => any)[] = [];

((useEventManager as any).subscribe as jest.Mock).mockImplementation((listener) => {
    eventManagerListeners.push(listener);
});

export const triggerEvent = (event: Event) => {
    eventManagerListeners.forEach((listener) => listener(event));
};
