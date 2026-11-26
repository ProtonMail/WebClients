import { type FC, useEffect } from 'react';

import { useIFrameAppController } from '../../../../../../../lib/components/Inline/IFrameApp';
import type { InlineToastAction } from '../../../../../constants.runtime';
import type { InlineToastRequest } from '../../toast.app';
import { ToastHeader } from '../components/ToastHeader';

const DURATION = 2_000;

type Props = Extract<InlineToastRequest, { action: InlineToastAction.TOAST }>;

export const ToastView: FC<Props> = ({ message }) => {
    const controller = useIFrameAppController();

    useEffect(() => {
        const timer = setTimeout(controller.close, DURATION);
        return () => clearTimeout(timer);
    }, []);

    return <ToastHeader title={message} wrapText />;
};
