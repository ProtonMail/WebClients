import { useEffect, useRef } from 'react';

import { getVatPrefix } from './vatPrefixHelper';

interface UseVatPrefixSyncProps {
    countryCode: string;
    setVatNumber: (value: string) => void;
    initialVatNumber?: string | null;
    enabled?: boolean;
}

/**
 * Keeps the VAT field's prefix in sync with the selected country:
 * - On mount with no initial VAT, prefills the prefix.
 * - On country change, wipes any entered VAT and prefills the new prefix.
 * - Leaves the field untouched on mount when an initial VAT is provided.
 *
 * A country change always replaces the field, regardless of whether the user
 * has typed into it. `markVatNumberDirty` only matters when the effect re-runs
 * *without* a country change (e.g. `enabled` flips false→true): calling it on
 * user edits prevents that re-run from clobbering the entered VAT number.
 */
export function useVatPrefixSync({
    countryCode,
    setVatNumber,
    initialVatNumber,
    enabled = true,
}: UseVatPrefixSyncProps) {
    const isPristineRef = useRef(!initialVatNumber);
    const previousCountryRef = useRef(countryCode);
    const setVatNumberRef = useRef(setVatNumber);
    setVatNumberRef.current = setVatNumber;

    useEffect(() => {
        // Track the previous country unconditionally, even while disabled, so a later
        // enabled false→true flip across a country change doesn't see a stale ref and clobber the field.
        const countryChanged = previousCountryRef.current !== countryCode;
        previousCountryRef.current = countryCode;

        if (!enabled) {
            return;
        }

        if (!countryChanged && !isPristineRef.current) {
            return;
        }

        setVatNumberRef.current(getVatPrefix(countryCode) ?? '');
        isPristineRef.current = true;
    }, [countryCode, enabled]);

    return {
        markVatNumberDirty: () => {
            isPristineRef.current = false;
        },
    };
}
