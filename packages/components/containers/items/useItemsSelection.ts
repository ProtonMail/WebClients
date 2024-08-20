import type { ChangeEvent, DependencyList } from 'react';
import { useEffect, useMemo, useState } from 'react';

import unique from '@proton/utils/unique';

import useHandler from '../../hooks/useHandler';

interface Props {
    activeID?: string;
    allIDs: string[];
    resetDependencies?: DependencyList;
    onCheck?: (checked: boolean) => void;
    rowMode?: boolean;
}

/**
 * Implement the selection logic shared between mail and contacts
 * You have an active id which represents the selection if there is no checked items
 * As soon as you have checked items, it replaces the active item
 * Items can be any object, we only deal with IDs
 * @param activeID The current active item
 * @param allIDs The complete list of ids in the list
 * @param resetDependencies React dependencies to reset selection if there is a change
 * @param onCheck Optional action to be triggered when interacting with element checkboxes
 * @param rowMode Used only for mail since we keep checkedMap state in row mode
 * @returns all helpers useful to check one, a range or all items
 */
const useItemsSelection = ({ activeID, allIDs, rowMode, resetDependencies, onCheck }: Props) => {
    // We are managing checked IDs through a Map and not an array for performance issues.
    const [checkedMap, setCheckedMap] = useState<{ [ID: string]: boolean }>({});

    // Last item check to deal with range selection
    const [lastChecked, setLastChecked] = useState<string>('');

    const isChecked = (ID: string) => !!checkedMap[ID];

    useEffect(() => setCheckedMap({}), resetDependencies || []);

    const checkedIDs = useMemo(() => {
        return Object.keys(checkedMap).filter((ID) => checkedMap[ID]);
    }, [checkedMap]);

    const selectedIDs = useMemo(() => {
        // In row mode, activeID has priority over checkedIDs
        if (activeID && rowMode) {
            return [activeID];
        }
        if (checkedIDs.length) {
            return checkedIDs;
        }
        if (activeID) {
            return [activeID];
        }
        return [];
    }, [checkedIDs, activeID]);

    /**
     * Put *IDs* to *checked* state
     * Uncheck others if *replace* is true
     */
    const handleCheck = useHandler((IDs: string[], checked: boolean, replace: boolean) => {
        // Run onCheck function when interacting with a checkbox
        onCheck?.(checked);
        // Items can be checked and included in a new selection (select all/select range).
        // In that case they will be duplicated in the array, which could break the length we expect in the 2nd condition
        const uniqueIDs = unique(IDs);
        if (uniqueIDs.length === 0) {
            setCheckedMap({});
        } else if (uniqueIDs.length === allIDs.length) {
            setCheckedMap(
                allIDs.reduce<{ [ID: string]: boolean }>((acc, ID) => {
                    acc[ID] = checked;
                    return acc;
                }, {})
            );
        } else {
            setCheckedMap(
                allIDs.reduce<{ [ID: string]: boolean }>((acc, ID) => {
                    const wasChecked = isChecked(ID);
                    const toCheck = IDs.includes(ID);
                    let value: boolean;
                    if (toCheck) {
                        value = checked;
                    } else if (replace) {
                        value = !checked;
                    } else {
                        value = wasChecked;
                    }
                    acc[ID] = value;
                    return acc;
                }, {})
            );
        }

        setLastChecked('');
    });

    /**
     * Check or uncheck all items
     */
    const handleCheckAll = useHandler((check: boolean) =>
        check ? handleCheck(allIDs, true, true) : handleCheck([], true, true)
    );

    /**
     * Just check the given id, nothing more
     */
    const handleCheckOnlyOne = useHandler((id: string) => {
        handleCheck([id], !isChecked(id), false);
        setLastChecked(id);
    });

    /**
     * Check all items from the last checked to the given id
     */
    const handleCheckRange = useHandler((id: string) => {
        const ids = [id];

        if (lastChecked) {
            const start = allIDs.findIndex((ID) => ID === id);
            const end = allIDs.findIndex((ID) => ID === lastChecked);

            ids.push(...allIDs.slice(Math.min(start, end), Math.max(start, end) + 1));
        }

        handleCheck(ids, !isChecked(id), false);
        setLastChecked(id);
    });

    /**
     * Check only one or check range depending on the shift key value in the event
     */
    const handleCheckOne = useHandler((event: ChangeEvent, id: string) => {
        const { shiftKey } = event.nativeEvent as any;

        if (shiftKey) {
            handleCheckRange(id);
        } else {
            handleCheckOnlyOne(id);
        }
    });

    // Automatically uncheck an id which is not anymore in the list (Happens frequently when using search)
    useEffect(() => {
        const filteredCheckedIDs = checkedIDs.filter((id) => allIDs.includes(id));

        if (filteredCheckedIDs.length !== checkedIDs.length) {
            handleCheck(filteredCheckedIDs, true, true);
        }
    }, [allIDs]);

    return {
        checkedIDs,
        selectedIDs,
        handleCheck,
        handleCheckAll,
        handleCheckOne,
        handleCheckOnlyOne,
        handleCheckRange,
    };
};

export default useItemsSelection;
