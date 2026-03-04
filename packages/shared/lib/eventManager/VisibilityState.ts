import createListeners from '@proton/shared/lib/helpers/listeners';

export const isVisible = (): boolean => {
    return document.visibilityState === 'visible';
};
/**
 * The purpose of this class is to maintain the state of visibility, and in addition, listen
 * to updates from DOM so that the event manager always knows the latest value.
 */
export class VisibilityState {
    public visible = isVisible();
    private listeners = createListeners<[boolean]>();

    private handler = () => {
        this.visible = isVisible();
        this.listeners.notify(this.visible);
    };

    public subscribe = (callback: (value: boolean) => void) => {
        // If it's the first time subscribing, add the DOM listener.
        if (!this.listeners.length()) {
            // And make sure we get the latest visible value.
            this.visible = isVisible();
            document.addEventListener('visibilitychange', this.handler);
        }

        const unsubscribe = this.listeners.subscribe(callback);

        return () => {
            unsubscribe();

            // If no more subscribers, remove the DOM listener.
            if (!this.listeners.length()) {
                document.removeEventListener('visibilitychange', this.handler);
            }
        };
    };
}

let instance: VisibilityState | null = null;

export const getVisibilityStateSingleton = (): VisibilityState => {
    if (instance === null) {
        instance = new VisibilityState();
    }
    return instance;
};
