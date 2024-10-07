import type { RefObject } from 'react';
import { useEffect, useRef } from 'react';

import type { SelectedDrawerOption } from '@proton/components/components/drawer/views/DrawerView';
import { CONTACT_TAB } from '@proton/components/components/drawer/views/interface';

const useDrawerParent = (searchInputRef: RefObject<HTMLInputElement>, tab: SelectedDrawerOption) => {
    const animationEnded = useRef(false);

    const onFocusSearchInput = () => {
        searchInputRef?.current?.focus();
        animationEnded.current = true;
    };

    // When we switch tab (contact, contact group, setting), we also want to focus the search input
    useEffect(() => {
        if (animationEnded.current && tab.value === CONTACT_TAB.CONTACT) {
            onFocusSearchInput();
        }
    }, [tab]);

    return { onFocusSearchInput };
};

export default useDrawerParent;
