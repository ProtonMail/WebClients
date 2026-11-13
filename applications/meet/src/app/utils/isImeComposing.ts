import type { KeyboardEvent as ReactKeyboardEvent } from 'react';

// Safari fires the keydown that ends a composition after compositionend, with isComposing false and keyCode 229.
export const isImeComposing = (event: ReactKeyboardEvent | KeyboardEvent): boolean => {
    const nativeEvent = 'nativeEvent' in event ? event.nativeEvent : event;
    return nativeEvent.isComposing || event.keyCode === 229;
};
