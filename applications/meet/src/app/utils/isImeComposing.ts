import type { KeyboardEvent } from 'react';

// Safari fires the keydown that ends a composition after compositionend, with isComposing false and keyCode 229.
export const isImeComposing = (event: KeyboardEvent): boolean => event.nativeEvent.isComposing || event.keyCode === 229;
