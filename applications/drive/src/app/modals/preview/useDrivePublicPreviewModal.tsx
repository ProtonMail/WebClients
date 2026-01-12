import { useCallback, useState } from 'react';

import { Preview, type PreviewProps } from './Preview';

type PreviewPropsWithoutOnClose = Omit<PreviewProps, 'onNodeChange' | 'onClose'>;

export function useDrivePublicPreviewModal() {
    const [open, setOpen] = useState(false);
    const [props, setProps] = useState<PreviewPropsWithoutOnClose | undefined>(undefined);

    const showPreviewModal = useCallback((props: PreviewPropsWithoutOnClose) => {
        setProps(props);
        setOpen(true);
    }, []);

    const onClose = useCallback(() => {
        setOpen(false);
    }, []);

    return [open && props ? <Preview onClose={onClose} {...props} /> : null, showPreviewModal] as const;
}
