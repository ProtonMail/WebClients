/**
 * Find the calendar id for an event, since it's not always returned.
 * @param {Map} calendarBootstrapCache
 * @param {Function} cb
 */
const findCalendarID = (calendarBootstrapCache, cb) => {
    // eslint-disable-next-line no-restricted-syntax
    for (const [calendarID, record] of calendarBootstrapCache) {
        // The old bootstrapped result
        if (
            record &&
            record.value &&
            cb(record.value)
        ) {
            return calendarID;
        }
    }
};

/**
 * Assumes that the calendar bootstrap cache is never rendered with a hook.
 * @param {Array} CalendarKeys
 * @param {Array} CalendarSettings
 * @param {Map} calendarBootstrapCache
 * @param {Map} calendarKeysCache
 */
export const updateObject = (
    { CalendarKeys = [], CalendarSettings = [] },
    calendarBootstrapCache,
    calendarKeysCache
) => {
    if (!calendarBootstrapCache) {
        return;
    }

    if (CalendarSettings.length) {
        // eslint-disable-next-line no-restricted-syntax
        for (const { ID: CalendarID, CalendarSettings: newValue } of CalendarSettings) {
            const oldRecord = calendarBootstrapCache.get(CalendarID);
            if (oldRecord.value) {
                // Mutation is on purpose, since it assumes it's never rendered.
                oldRecord.value.CalendarSettings = newValue;
            }
        }
    }

    if (CalendarKeys.length) {
        const deleteCalendarFromCache = (calendarID) => {
            if (calendarBootstrapCache) {
                calendarBootstrapCache.delete(calendarID);
            }
            if (calendarKeysCache) {
                calendarKeysCache.delete(calendarID);
            }
        };

        CalendarKeys.forEach(({ ID: KeyID, Key }) => {
            // When a new calendar key is received, the entire calendar cache is invalidated.
            // TODO: Merge the bootstrapped version.
            if (Key && Key.CalendarID) {
                deleteCalendarFromCache(Key.CalendarID);
                return;
            }
            const calendarID = findCalendarID(calendarBootstrapCache, ({ Keys }) => {
                return Array.isArray(Keys) && Keys.find(({ ID: otherID }) => otherID === KeyID);
            });
            if (calendarID) {
                deleteCalendarFromCache(Key.CalendarID);
            }
        });
    }
};
