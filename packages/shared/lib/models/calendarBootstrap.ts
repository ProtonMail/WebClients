import {
    getIsCalendarMemberEventManagerCreate,
    getIsCalendarMemberEventManagerDelete,
    getIsCalendarMemberEventManagerUpdate,
} from '../eventManager/helpers';
import { CalendarKey, CalendarMember, CalendarSettings as tsCalendarSettings } from '../interfaces/calendar';
import { CalendarMemberEventManager } from '../interfaces/calendar/EventManager';

/**
 * Find the calendar id for an event, since it's not always returned.
 */
const findCalendarID = (calendarBootstrapCache: Map<string, any>, cb: (value: any) => boolean) => {
    for (const [calendarID, record] of calendarBootstrapCache) {
        // The old bootstrapped result
        if (record && record.value && cb(record.value)) {
            return calendarID;
        }
    }
};

/**
 * Assumes that updates to the calendar bootstrap cache do not trigger UI updates
 * In other words, that the bootstrap is only used through callbacks but not needed to re-render UI
 * In consequence, no setCache is invoked, the cache is mutated directly
 */
export const updateBootstrapKeysAndSettings = (
    {
        CalendarKeys = [],
        CalendarSettings = [],
    }: {
        CalendarKeys: { ID: string; Key: CalendarKey }[];
        CalendarSettings: { CalendarSettings: tsCalendarSettings }[];
    },
    calendarBootstrapCache: Map<string, any>,
    calendarKeysCache: Map<string, any>
) => {
    if (!calendarBootstrapCache) {
        return;
    }

    if (CalendarSettings.length) {
        for (const { CalendarSettings: newValue } of CalendarSettings) {
            const oldRecord = calendarBootstrapCache.get(newValue.CalendarID);
            if (oldRecord && oldRecord.value) {
                // Mutation on purpose
                oldRecord.value.CalendarSettings = newValue;
            }
        }
    }

    if (CalendarKeys.length) {
        const deleteCalendarFromCache = (calendarID: string) => {
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

/**
 * Assumes that updates to the calendar bootstrap cache do not trigger UI updates
 * In other words, that the bootstrap is only used through callbacks but not needed to re-render UI
 * In consequence, no setCache is invoked, the cache is mutated directly
 */
export const updateBootstrapMembers = (
    calendarBootstrapCache: Map<string, any>,
    {
        CalendarMembers = [],
    }: {
        CalendarMembers?: CalendarMemberEventManager[];
    }
) => {
    if (!calendarBootstrapCache) {
        return;
    }

    if (CalendarMembers.length) {
        CalendarMembers.forEach((event) => {
            if (getIsCalendarMemberEventManagerDelete(event)) {
                const { ID: memberID } = event;
                const calendarID = findCalendarID(calendarBootstrapCache, ({ Members }) => {
                    return Members.find(({ ID }: { ID: string }) => ID === memberID);
                });
                if (!calendarID) {
                    return;
                }
                const oldRecord = calendarBootstrapCache.get(calendarID);
                const oldMembers = oldRecord.value.Members as CalendarMember[];
                const memberIndex = oldMembers.findIndex(({ ID }) => memberID === ID);
                if (memberIndex !== -1) {
                    return;
                }
                // Mutation on purpose
                oldMembers.splice(memberIndex, 1);
            } else {
                const { ID, Member } = event;
                const oldRecord = calendarBootstrapCache.get(Member.CalendarID);
                if (!oldRecord?.value) {
                    return;
                }
                const oldMembers = oldRecord.value.Members as CalendarMember[];
                const memberIndex = oldMembers.findIndex(({ ID: memberID }) => memberID === ID);
                if (getIsCalendarMemberEventManagerCreate(event)) {
                    if (memberIndex !== -1) {
                        return;
                    }
                    // Mutation on purpose
                    oldMembers.push(Member);
                } else if (getIsCalendarMemberEventManagerUpdate(event)) {
                    if (memberIndex === -1) {
                        return;
                    }
                    // Mutation on purpose
                    oldMembers.splice(memberIndex, 1, event.Member);
                }
            }
        });
    }
};
