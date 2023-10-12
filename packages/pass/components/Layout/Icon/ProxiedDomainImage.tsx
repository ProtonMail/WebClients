import { type CSSProperties, type VFC, useEffect, useMemo } from 'react';

import { useConfig } from '@proton/components/hooks';
import { safeCall } from '@proton/pass/utils/fp';
import { isValidURL } from '@proton/pass/utils/url';

export enum ImageStatus {
    LOADING,
    READY,
    ERROR,
}

interface Props {
    className?: string;
    status: ImageStatus;
    style?: CSSProperties;
    url: string;
    onStatusChange: (status: ImageStatus) => void;
}

const getImageURL = (apiUrl: string, domain?: string) => {
    if (domain) {
        const basePath = BUILD_TARGET === 'firefox' ? apiUrl : 'api-proxy';
        return `${basePath}/core/v4/images/logo?Domain=${domain}&Size=32&Mode=light&MaxScaleUpFactor=4`;
    }
};

export const ProxiedDomainImage: VFC<Props> = ({ className, status, style = {}, url, onStatusChange }) => {
    const { API_URL } = useConfig();
    const domain = useMemo(() => safeCall(() => new URL(isValidURL(url).url).host)(), [url]);
    useEffect(() => onStatusChange(domain ? ImageStatus.LOADING : ImageStatus.ERROR), [domain, onStatusChange]);

    const styles = { visibility: status === ImageStatus.READY ? 'visible' : 'hidden', ...style };

    return (
        <img
            alt=""
            className={className}
            onError={() => onStatusChange(ImageStatus.ERROR)}
            onLoad={() => onStatusChange(ImageStatus.READY)}
            src={getImageURL(API_URL, domain)}
            style={styles}
        />
    );
};
