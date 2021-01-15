import { useEffect, useState } from 'react';
import { useHandler } from 'react-components';
import { useDeepMemo } from '../useDeepMemo';

export const useMailboxSelection = (labelID: string, elementID: string | undefined, elementIDs: string[]) => {
    const [checkedElements, setCheckedElements] = useState<{ [ID: string]: boolean }>({});
    const [lastChecked, setLastChecked] = useState<string>('');

    useEffect(() => setCheckedElements({}), [labelID]);

    const checkedIDs = useDeepMemo(() => {
        return Object.entries(checkedElements).reduce((acc, [elementID, isChecked]) => {
            if (!isChecked) {
                return acc;
            }
            acc.push(elementID);
            return acc;
        }, [] as string[]);
    }, [checkedElements]);

    const selectedIDs = useDeepMemo(() => {
        if (checkedIDs.length) {
            return checkedIDs;
        }
        if (elementID) {
            return [elementID];
        }
        return [];
    }, [checkedIDs, elementID]);

    /**
     * Put *IDs* to *checked* state
     * Uncheck others if *replace* is true
     */
    const handleCheck = useHandler((IDs: string[], checked: boolean, replace: boolean) => {
        setCheckedElements(
            elementIDs.reduce((acc, ID) => {
                const wasChecked = checkedIDs.includes(ID);
                const toCheck = IDs.includes(ID);
                acc[ID] = toCheck ? checked : replace ? !checked : wasChecked;
                return acc;
            }, {} as { [ID: string]: boolean })
        );
        setLastChecked('');
    });

    const handleUncheckAll = () => handleCheck([], true, true);

    const handleCheckElement = (id: string) => {
        handleCheck([id], !checkedElements[id], false);
        setLastChecked(id);
    };

    const handleCheckRange = (id: string) => {
        const ids = [id];

        if (lastChecked) {
            const start = elementIDs.findIndex((ID) => ID === id);
            const end = elementIDs.findIndex((ID) => ID === lastChecked);

            ids.push(...elementIDs.slice(Math.min(start, end), Math.max(start, end) + 1));
        }

        handleCheck(ids, !checkedElements[id], false);
        setLastChecked(id);
    };

    return { checkedIDs, selectedIDs, handleCheck, handleUncheckAll, handleCheckElement, handleCheckRange };
};
