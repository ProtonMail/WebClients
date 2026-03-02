export type CommonButtonProps<T extends object = object> =
    | (T & { buttonType: 'toolbar'; onClick: () => void | Promise<void>; close?: never })
    | (T & { buttonType: 'contextMenu'; onClick: () => void | Promise<void>; close: () => void });
