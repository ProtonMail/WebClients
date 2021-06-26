import { getSHA256String } from 'proton-shared/lib/helpers/crypto';

const DAY_IN_MILLISECONDS = 86400000;
const LOCALSTORAGE_TZ_KEY = 'tzSuggestion';

export const getTimezoneSuggestionKey = async (userID: string) => {
    return getSHA256String(`${LOCALSTORAGE_TZ_KEY}${userID}`);
};

export const getLastTimezoneSuggestion = (key: string) => {
    const defaultDate = new Date(2000, 0, 1);
    try {
        const lastSuggestion = parseInt(`${window.localStorage.getItem(key)}`, 10);
        const date = new Date(lastSuggestion);
        if (Number.isNaN(+date)) {
            return defaultDate;
        }
        return date;
    } catch (e) {
        return defaultDate;
    }
};

export const saveLastTimezoneSuggestion = (key: string) => {
    try {
        const timestamp = +new Date();
        window.localStorage.setItem(key, `${timestamp}`);
        // eslint-disable-next-line no-empty
    } catch (e) {}
};

export const canAskTimezoneSuggestion = (key: string) => {
    return Date.now() - +getLastTimezoneSuggestion(key) >= DAY_IN_MILLISECONDS;
};
