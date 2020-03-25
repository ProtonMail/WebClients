const DAY_IN_MILLISECONDS = 86400000;
const LOCALSTORAGE_TZ_KEY = 'tzSuggestion';

export const getLastTimezoneSuggestion = () => {
    const defaultDate = new Date(2000, 0, 1);
    try {
        const lastSuggestion = parseInt('' + window.localStorage.getItem(LOCALSTORAGE_TZ_KEY), 10);
        const date = new Date(lastSuggestion);
        if (isNaN(+date)) {
            return defaultDate;
        }
        return date;
    } catch (e) {
        return defaultDate;
    }
};

export const saveLastTimezoneSuggestion = () => {
    try {
        const timestamp = +new Date();
        window.localStorage.setItem(LOCALSTORAGE_TZ_KEY, timestamp + '');
        // eslint-disable-next-line no-empty
    } catch (e) {}
};

export const canAskTimezoneSuggestion = () => {
    return Date.now() - +getLastTimezoneSuggestion() >= DAY_IN_MILLISECONDS;
};
