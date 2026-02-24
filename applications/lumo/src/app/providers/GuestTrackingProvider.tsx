import type {ReactNode} from 'react';
import {createContext, useCallback, useContext, useEffect, useState} from 'react';

import {useTierErrors} from '../hooks/useTierErrors';
import {useLumoPlan} from './LumoPlanProvider';

const STORAGE_KEY = 'lumo_guest';
const GUEST_QUESTION_LIMIT = 25;
const WEEK_IN_MS = 7 * 24 * 60 * 60 * 1000;

interface GuestQuestionTracking {
    count: number;
    timestamp: number;
}

interface GuestTrackingContextValue {
    hasExceededLimit: boolean;
    incrementCount: () => void;
}

const GuestTrackingContext = createContext<GuestTrackingContextValue | null>(null);

const getInitialTracking = (): GuestQuestionTracking => ({
    count: 0,
    timestamp: Date.now(),
});

const loadFromLocalStorage = (): GuestQuestionTracking => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return getInitialTracking();

        return JSON.parse(stored);
    } catch (error) {
        console.error('Error loading guest question tracking:', error);
        return getInitialTracking();
    }
};

const saveToLocalStorage = (tracking: GuestQuestionTracking) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tracking));
    } catch (error) {
        console.error('Error saving guest question tracking:', error);
    }
};

interface Props {
    children: ReactNode;
}

export const GuestTrackingProvider = ({ children }: Props) => {
    const { lumoUserType, isGuest } = useLumoPlan();
    const { addTierError, tierErrors } = useTierErrors();

    const [tracking, setTracking] = useState<GuestQuestionTracking>(loadFromLocalStorage);

    // Check and reset week if needed
    useEffect(() => {
        if (!isGuest) return;

        const now = Date.now();
        const weekElapsed = now - tracking.timestamp > WEEK_IN_MS;

        if (weekElapsed) {
            const newTracking = getInitialTracking();
            setTracking(newTracking);
            saveToLocalStorage(newTracking);
        }
    }, [isGuest, tracking]);

    // Handle tier error when limit is exceeded
    useEffect(() => {
        if (!isGuest) return;

        const hasExceededLimit = tracking.count >= GUEST_QUESTION_LIMIT;
        if (hasExceededLimit && tierErrors.length === 0) {
            addTierError(lumoUserType);
        }
    }, [isGuest, tracking.count, tierErrors.length, addTierError, lumoUserType]);

    const incrementCount = useCallback(() => {
        if (!isGuest) return;

        const newTracking = {
            ...tracking,
            count: tracking.count + 1,
        };
        setTracking(newTracking);
        saveToLocalStorage(newTracking);
    }, [isGuest, tracking]);

    const value = isGuest
        ? {
              hasExceededLimit: tracking.count >= GUEST_QUESTION_LIMIT,
              incrementCount,
          }
        : null;

    return <GuestTrackingContext.Provider value={value}>{children}</GuestTrackingContext.Provider>;
};

export const useGuestTracking = (): GuestTrackingContextValue | null => {
    return useContext(GuestTrackingContext);
};
