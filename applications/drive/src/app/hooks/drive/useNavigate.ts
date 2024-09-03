import { useCallback } from 'react';
import { useHistory, useLocation } from 'react-router-dom';

import generateUID from '@proton/atoms/generateUID';

import { toLinkURLType } from '../../components/sections/helpers';

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
        (shareId: string, linkId: string, isFile: boolean, rPath?: string) => {
            pushToHistory(`/${shareId}/${toLinkURLType(isFile)}/${linkId}?r=${rPath || location.pathname}`);
        },
        [history, location.pathname]
    );

    const redirectToLink = useCallback(
        (shareId: string, linkId: string, isFile: boolean) => {
            history.replace(`/${shareId}/${toLinkURLType(isFile)}/${linkId}`);
        },
        [history]
    );

    const navigateToRoot = useCallback(() => {
        pushToHistory(`/`);
    }, [history]);

    const navigateToNoAccess = useCallback(() => {
        pushToHistory(`/no-access`);
    }, [history]);

    const navigateToSharedByMe = useCallback(() => {
        pushToHistory(`/shared-urls`);
    }, [history]);

    const navigateToTrash = useCallback(() => {
        pushToHistory(`/trash`);
    }, [history]);

    const navigateToDevices = () => {
        pushToHistory('/devices');
    };

    const navigateToSharedWithMe = () => {
        pushToHistory(`/shared-with-me`);
    };

    const navigateToSearch = useCallback(
        (searchTerm: string) => {
            history.push({
                pathname: '/search',
                hash: `q=${searchTerm}`,
            });
        },
        [history]
    );

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
        navigateToNoAccess,
        navigateToSharedByMe,
        navigateToTrash,
        navigateToSearch,
        addListener,
        removeListener,
        navigateToDevices,
        navigateToSharedWithMe,
        redirectToLink,
    };
}

export default useNavigate;
