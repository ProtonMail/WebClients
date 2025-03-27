import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom-v5-compat';

import generateUID from '@proton/utils/generateUID';

import { toLinkURLType } from '../../components/sections/helpers';

interface NavigationEvenListener {
    id: string;
    run: () => void;
}

let listeners: NavigationEvenListener[] = [];

function useDriveNavigation() {
    const navigate = useNavigate();
    const location = useLocation();

    const pushToHistory = (path: string) => {
        navigate(path);
        listeners.forEach((listener) => {
            listener.run();
        });
    };

    const navigateToLink = useCallback(
        (shareId: string, linkId: string, isFile: boolean, rPath?: string) => {
            pushToHistory(`/${shareId}/${toLinkURLType(isFile)}/${linkId}?r=${rPath || location.pathname}`);
        },
        [location.pathname]
    );

    const redirectToLink = useCallback((shareId: string, linkId: string, isFile: boolean) => {
        navigate(`/${shareId}/${toLinkURLType(isFile)}/${linkId}`, { replace: true });
    }, []);

    const navigateToRoot = useCallback(() => {
        pushToHistory('/');
    }, []);

    const navigateToNoAccess = useCallback(() => {
        pushToHistory('/no-access');
    }, []);

    const navigateToSharedByMe = useCallback(() => {
        pushToHistory('/shared-urls');
    }, []);

    const navigateToTrash = useCallback(() => {
        pushToHistory('/trash');
    }, []);

    const navigateToDevices = useCallback(() => {
        pushToHistory('/devices');
    }, []);

    const navigateToSharedWithMe = useCallback(() => {
        pushToHistory('/shared-with-me');
    }, []);

    const navigateToAlbum = useCallback(
        (shareId: string, linkId: string, options?: { openShare?: boolean; addPhotos?: boolean }) => {
            const searchParams = new URLSearchParams();
            if (options?.openShare) {
                searchParams.set('openShare', 'true');
            }

            const queryString = searchParams.toString();
            const url = `/photos/albums/${shareId}/album/${linkId}${options?.addPhotos ? '/add-photos' : ''}${queryString ? `?${queryString}` : ''}`;

            pushToHistory(url);
        },
        []
    );

    const navigateToPhotos = useCallback(() => {
        pushToHistory('/photos');
    }, []);

    const navigateToAlbums = useCallback(() => {
        pushToHistory(`/photos/albums`);
    }, []);

    const navigateToSearch = useCallback((searchTerm: string) => {
        navigate({
            pathname: '/search',
            hash: `q=${searchTerm}`,
        });
    }, []);

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
        navigateToAlbum,
        navigateToPhotos,
        navigateToAlbums,
    };
}

export default useDriveNavigation;
