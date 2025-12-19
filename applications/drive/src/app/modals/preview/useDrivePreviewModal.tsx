import { useCallback, useRef, useState } from 'react';

import { splitNodeUid } from '@proton/drive/index';

import { Preview, type PreviewProps } from './Preview';

type PreviewPropsWithoutOnClose = Omit<PreviewProps, 'onNodeChange' | 'onClose'>;

export function useDrivePreviewModal() {
    const [open, setOpen] = useState(false);
    const [props, setProps] = useState<PreviewPropsWithoutOnClose | undefined>(undefined);

    const previousLocationState = useRef<string | null>(null);

    // When user navigates back via back button, the location changes.
    // Because the location was not changed via router, nothing will happen.
    // This listener will close the preview modal if the user navigates back
    // to a location that is not a preview.
    const handleLocationChange = useCallback(() => {
        if (!window.location.href.includes('/file/')) {
            setOpen(false);
            window.removeEventListener('popstate', handleLocationChange);
        }
    }, []);

    const showPreviewModal = useCallback(
        (props: PreviewPropsWithoutOnClose) => {
            setProps(props);
            setOpen(true);

            const shareId = props.deprecatedContextShareId;
            const linkId = splitNodeUid(props.nodeUid).nodeId;

            previousLocationState.current = window.location.href;

            // Use window.history directly instead of using Router to avoid
            // re-rendering the entire app. We want to keep the previous
            // location with the same state (selection etc.) as before opening.
            // However, we need to change the URL so when user refreshes the page,
            // it goes back to the preview of given node.
            window.history.pushState(null, '', `/${shareId}/file/${linkId}`);

            window.addEventListener('popstate', handleLocationChange);
        },
        [handleLocationChange]
    );

    const onClose = useCallback(() => {
        setOpen(false);
        window.removeEventListener('popstate', handleLocationChange);

        if (previousLocationState.current) {
            window.history.pushState(null, '', previousLocationState.current);
            previousLocationState.current = null;
        }
    }, [handleLocationChange]);

    const onNodeChange = useCallback(
        (nodeUid: string) => {
            if (!props) {
                return;
            }

            const shareId = props.deprecatedContextShareId;
            const linkId = splitNodeUid(nodeUid).nodeId;

            window.history.pushState(null, '', `/${shareId}/file/${linkId}`);
        },
        [props]
    );

    return [
        open && props ? <Preview onClose={onClose} onNodeChange={onNodeChange} {...props} /> : null,
        showPreviewModal,
    ] as const;
}
