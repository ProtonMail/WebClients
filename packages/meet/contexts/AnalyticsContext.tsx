import { type ReactNode, createContext, useContext, useMemo, useRef } from 'react';

export type AnalyticsAttributes = Record<string, string | number | boolean>;

interface AnalyticsContextValue {
    getAnalyticsAttributes: () => AnalyticsAttributes;
}

const AnalyticsContext = createContext<AnalyticsContextValue>({ getAnalyticsAttributes: () => ({}) });

export const useGetAnalyticsAttributes = () => useContext(AnalyticsContext).getAnalyticsAttributes;

interface AnalyticsProviderProps {
    attributes: AnalyticsAttributes;
    children: ReactNode;
}

/**
 * Adds attributes to every Sentry report made from this subtree/childern components. Providers nest, so a report carries the
 * attributes of every provider above it, with the closest one winning on a repeated key and explicit tags
 * at the call site winning over all of them.
 */
export const AnalyticsProvider = ({ attributes, children }: AnalyticsProviderProps) => {
    const getParentAnalyticsAttributes = useGetAnalyticsAttributes();

    const attributesRef = useRef(attributes);
    attributesRef.current = attributes;

    const value = useMemo(
        () => ({
            getAnalyticsAttributes: () => ({ ...getParentAnalyticsAttributes(), ...attributesRef.current }),
        }),
        [getParentAnalyticsAttributes]
    );

    return <AnalyticsContext.Provider value={value}>{children}</AnalyticsContext.Provider>;
};
