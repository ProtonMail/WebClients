import { type CSSProperties, type FC, useEffect, useRef, useState } from 'react';

import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { useEnsureMounted } from '@proton/pass/hooks/useEnsureMounted';
import type { Maybe } from '@proton/pass/types';
import { intoDomainImageHostname } from '@proton/pass/utils/url/utils';
import clsx from '@proton/utils/clsx';
import noop from '@proton/utils/noop';

export enum ImageStatus {
    LOADING,
    READY,
    ERROR,
}

type Props = {
    className?: string;
    status: ImageStatus;
    style?: CSSProperties;
    url: string;
    onStatusChange: (status: ImageStatus) => void;
};

export const DomainIcon: FC<Props> = ({ className, status, style = {}, url, onStatusChange }) => {
    const { getDomainImage } = usePassCore();
    const ensureMounted = useEnsureMounted();
    const [src, setSrc] = useState<Maybe<string>>();

    const statusChange = useRef(onStatusChange);
    statusChange.current = onStatusChange;

    useEffect(() => {
        const controller = new AbortController();
        const domain = intoDomainImageHostname(url);
        if (!domain) return statusChange.current(ImageStatus.ERROR);

        (async () => {
            statusChange.current(ImageStatus.LOADING);
            const maybeSrc = await getDomainImage(domain, controller.signal);
            if (maybeSrc) ensureMounted(() => setSrc(maybeSrc))();
        })().catch(noop);

        return () => controller.abort(); /** Abort the underlying domain image request on unmount */
    }, [url]);

    return (
        <img
            alt=""
            className={clsx(status === ImageStatus.READY && 'anime-fade-in', className)}
            onError={() => onStatusChange(ImageStatus.ERROR)}
            onLoad={() => onStatusChange(ImageStatus.READY)}
            src={src}
            style={{ visibility: status === ImageStatus.READY ? 'visible' : 'hidden', ...style }}
            loading="lazy"
        />
    );
};
