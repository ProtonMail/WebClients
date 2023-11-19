import { type CSSProperties, type VFC, useEffect, useMemo } from 'react';

import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { safeCall } from '@proton/pass/utils/fp/safe-call';
import { isValidURL } from '@proton/pass/utils/url/is-valid-url';

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

export const ProxiedDomainImage: VFC<Props> = ({ className, status, style = {}, url, onStatusChange }) => {
    const { getDomainImageURL } = usePassCore();
    const domain = useMemo(() => safeCall(() => new URL(isValidURL(url).url).host)(), [url]);
    useEffect(() => onStatusChange(domain ? ImageStatus.LOADING : ImageStatus.ERROR), [domain, onStatusChange]);
    const styles = { visibility: status === ImageStatus.READY ? 'visible' : 'hidden', ...style };

    return (
        <img
            alt=""
            className={className}
            onError={() => onStatusChange(ImageStatus.ERROR)}
            onLoad={() => onStatusChange(ImageStatus.READY)}
            src={getDomainImageURL(domain)}
            style={styles}
        />
    );
};
