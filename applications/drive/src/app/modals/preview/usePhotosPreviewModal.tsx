import { useCallback, useState } from 'react';

import { Preview, type PreviewProps } from './Preview';

// Photos preview do not change the URL as main Drive preview.
// It means that after refresh, user will be back in the photo section instead
// of a specific photo preview.
export function usePhotosPreviewModal() {
    const [open, setOpen] = useState(false);
    const [props, setProps] = useState<PreviewProps | undefined>(undefined);

    const showPreviewModal = useCallback((props: PreviewProps) => {
        setProps(props);
        setOpen(true);
    }, []);

    const onClose = useCallback(() => {
        setOpen(false);
        if (props?.onClose) {
            props.onClose();
        }
    }, [props]);

    return [open && props ? <Preview {...props} onClose={onClose} /> : null, showPreviewModal] as const;
}
