import { useCallback } from 'react';
import { generateUID } from '@proton/components';
import { useHistory, useLocation } from 'react-router-dom';

import { LinkType } from '../../interfaces/link';
import { toLinkURLType } from '../../components/Drive/helpers';

interface NavigationEvenListener {
    id: string;
    run: () => void;
}

let listeners: NavigationEvenListener[] = [];

function useNavigate() {
    const history = useHistory();
    const location = useLocation();

    const pushToHistory = (path: string) => {
        history.push(path);
        listeners.forEach((listener) => {
            listener.run();
        });
    };

    const navigateToLink = useCallback(
        (shareId: string, linkId: string, type: LinkType) => {
            pushToHistory(`/${shareId}/${toLinkURLType(type)}/${linkId}?r=${location.pathname}`);
        },
        [history, location.pathname]
    );

    const navigateToRoot = useCallback(() => {
        pushToHistory(`/`);
    }, [history]);

    const navigateToSharedURLs = useCallback(() => {
        pushToHistory(`/shared-urls`);
    }, [history]);

    const navigateToTrash = useCallback(() => {
        pushToHistory(`/trash`);
    }, [history]);

    const addListener = (listener: () => void) => {
        const listenerId = generateUID('drive-navigation-event');
        listeners.push({ id: listenerId, run: listener });

        return listenerId;
    };

    const removeListener = (listenerId: string) => {
        listeners = listeners.filter(({ id }) => id !== listenerId);
    };

    return {
        navigateToLink,
        navigateToRoot,
        navigateToSharedURLs,
        navigateToTrash,
        addListener,
        removeListener,
    };
}

export default useNavigate;
