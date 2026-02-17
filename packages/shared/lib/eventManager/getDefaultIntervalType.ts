export const getDefaultIntervalType = (): 'foreground' | 'background' => {
    // In the default implementation, we ensure that document is defined since the event loop may be used in different contexts like a WebWorker
    return typeof document !== 'undefined' && 'visibilityState' in document && document.visibilityState === 'visible'
        ? 'foreground'
        : 'background';
};
