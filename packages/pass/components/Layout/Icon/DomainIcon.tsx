import { type CSSProperties, type VFC, useEffect, useRef, useState } from 'react';

import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { useEnsureMounted } from '@proton/pass/hooks/useEnsureMounted';
import type { Maybe } from '@proton/pass/types';
import { parseUrl } from '@proton/pass/utils/url/parser';
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

export const DomainIcon: VFC<Props> = ({ className, status, style = {}, url, onStatusChange }) => {
    const { getDomainImage } = usePassCore();
    const ensureMounted = useEnsureMounted();
    const [src, setSrc] = useState<Maybe<string>>();

    const statusChange = useRef(onStatusChange);
    statusChange.current = onStatusChange;

    useEffect(() => {
        const controller = new AbortController();
        const parsedUrl = parseUrl(url);
        const hostname = parsedUrl.hostname;

        if (!hostname || parsedUrl.isUnknownOrReserved) return statusChange.current(ImageStatus.ERROR);

        (async () => {
            statusChange.current(ImageStatus.LOADING);
            const maybeSrc = await getDomainImage(hostname, controller.signal);
            if (maybeSrc) ensureMounted(() => setSrc(maybeSrc))();
        })().catch(noop);

        return () => controller.abort(); /** Abort the underlying domain image request on unmount */
    }, [url]);

    return (
        <img
            alt=""
            className={className}
            onError={() => onStatusChange(ImageStatus.ERROR)}
            onLoad={() => onStatusChange(ImageStatus.READY)}
            src={src}
            style={{ visibility: status === ImageStatus.READY ? 'visible' : 'hidden', ...style }}
            loading="lazy"
        />
    );
};
