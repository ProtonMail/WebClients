import { createContext, useContext } from 'react';

import type { OpenCallbackProps } from './subscriptionModalTypes';

/** Resolves after subscription data is loaded and the modal is opened (or after an early exit e.g. redirect). */
export type OpenSubscriptionModalCallback = (props: OpenCallbackProps) => Promise<void>;

const defaultOpenSubscriptionModal: OpenSubscriptionModalCallback = () => Promise.resolve();

/**
 * [openSubscriptionModal, loadingData, isSubscriptionModalAvailable]
 * — third entry is `false` when no `SubscriptionModalProvider` ancestor (React default context).
 */
export type SubscriptionModalContextValue = readonly [
    OpenSubscriptionModalCallback,
    boolean,
    isSubscriptionModalAvailable: boolean,
];

export const SubscriptionModalContext = createContext<SubscriptionModalContextValue>([
    defaultOpenSubscriptionModal,
    false,
    false,
]);

export const useSubscriptionModal = () => {
    return useContext(SubscriptionModalContext);
};

/**
 * Like {@link useSubscriptionModal}, but for trees that may render without `SubscriptionModalProvider`.
 *
 * Returns `[open, loading]` where `open` is `undefined` when no provider is mounted (React default context). In that
 * case `loading` is always `false`. Under a provider, `open` is the real callback and `loading` matches preload / open
 * state.
 *
 * Prefer {@link useSubscriptionModal} when the component is always wrapped by `SubscriptionModalProvider`, so
 * callers keep a non-optional `open` function.
 */
export const useOptionalSubscriptionModal = (): [OpenSubscriptionModalCallback | undefined, boolean] => {
    const [openSubscriptionModal, loadingData, isSubscriptionModalAvailable] = useSubscriptionModal();
    if (!isSubscriptionModalAvailable) {
        return [undefined, false];
    }
    return [openSubscriptionModal, loadingData];
};

/**
 * Escape hatch for {@link useSubscriptionModal} that returns only the `open` callback and skips the
 * `loading` value. The `custom-rules/use-subscription-modal-loading` lint rule requires callers of
 * `useSubscriptionModal` to destructure the loading flag; switch to this variant when you intentionally
 * want to ignore it and handle the promise returned by `openSubscriptionModal()` yourself.
 */
export const useSubscriptionModalRaw = () => {
    // eslint-disable-next-line custom-rules/use-subscription-modal-loading
    const [openSubscriptionModal] = useSubscriptionModal();
    return openSubscriptionModal;
};

/**
 * Escape hatch for {@link useOptionalSubscriptionModal} that returns only the `open` callback and skips the
 * `loading` value. The `custom-rules/use-subscription-modal-loading` lint rule requires callers of
 * `useOptionalSubscriptionModal` to destructure the loading flag; switch to this variant when you intentionally
 * want to ignore it and handle the promise returned by `openSubscriptionModal()` yourself.
 */
export const useOptionalSubscriptionModalRaw = () => {
    // eslint-disable-next-line custom-rules/use-subscription-modal-loading
    const [openSubscriptionModal] = useOptionalSubscriptionModal();
    return openSubscriptionModal;
};
