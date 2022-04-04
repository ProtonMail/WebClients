export const isKeyboardEvent = (event: Event): event is KeyboardEvent => {
    if ('key' in event) {
        return true;
    }
    return false;
};

export const isDragEvent = (event: Event): event is DragEvent => {
    if ('dataTransfer' in event) {
        return true;
    }
    return false;
};

const assignKeyboardKeys = (customEvent: CustomEvent, event: Event) => {
    const KEYBOARD_EVENT_RELATED_KEYS = [
        'altKey',
        'charCode',
        'ctrlKey',
        'code',
        'key',
        'keyCode',
        'locale',
        'location',
        'metaKey',
        'repeat',
        'shiftKey',
    ];

    KEYBOARD_EVENT_RELATED_KEYS.forEach((key) => {
        // @ts-expect-error
        customEvent[key] = event[key];
    });
};

export const cloneEvent = (event: Event) => {
    const clonedEvent = new CustomEvent(event.type, { bubbles: true });

    if (isDragEvent(event)) {
        // @ts-expect-error 'dataTransfert' key is not present in customEvent interface
        clonedEvent.dataTransfer = event.dataTransfer;
    }

    if (isKeyboardEvent(event)) {
        assignKeyboardKeys(clonedEvent, event);
    }

    return clonedEvent;
};
