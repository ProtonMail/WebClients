import { type CSSProperties, type VFC, useMemo } from 'react';

import { API_URL } from '../../../app/config';

export enum ImageStatus {
    LOADING,
    READY,
    ERROR,
}

interface Props {
    className?: string;
    onStatusChange: (status: ImageStatus) => void;
    status: ImageStatus;
    url: string;
    style?: CSSProperties;
}

const getImageURL = (domain?: string) => {
    if (domain) {
        const basePath = BUILD_TARGET === 'firefox' ? API_URL : 'api-proxy';
        return `${basePath}/core/v4/images/logo?Domain=${domain}&Size=32&Mode=light&MaxScaleUpFactor=4`;
    }
};

export const ProxiedDomainImage: VFC<Props> = ({ className, onStatusChange, status, url, style = {} }) => {
    const domain = useMemo(() => {
        try {
            onStatusChange(ImageStatus.LOADING);
            return new URL(url).host;
        } catch (error) {
            onStatusChange(ImageStatus.ERROR);
        }
    }, [url]);

    const styles = { visibility: status === ImageStatus.READY ? 'visible' : 'hidden', ...style };

    return (
        <img
            alt=""
            className={className}
            onError={() => onStatusChange(ImageStatus.ERROR)}
            onLoad={() => onStatusChange(ImageStatus.READY)}
            src={getImageURL(domain)}
            style={styles}
        />
    );
};
