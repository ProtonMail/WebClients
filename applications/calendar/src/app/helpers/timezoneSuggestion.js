const DAY_IN_MILLISECONDS = 86400000;

export const getLastTimezoneSuggestion = () => {
    const defaultDate = new Date(2000, 0, 1);
    try {
        const lastSuggestion = parseInt(window.localStorage.getItem('tzSuggestion'), 10);
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
        window.localStorage.setItem('tzSuggestion', +new Date());
        // eslint-disable-next-line no-empty
    } catch (e) {}
};

export const canAskTimezoneSuggestion = () => {
    return Date.now() - getLastTimezoneSuggestion() >= DAY_IN_MILLISECONDS;
};
