import { type FC, useMemo } from 'react';

import type { Item } from 'proton-authenticator/lib/db/entities/items';
import { issuerService } from 'proton-authenticator/lib/wasm/service';

import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import { safeCall } from '@proton/pass/utils/fp/safe-call';

type CodeLogoProps = Pick<Item, 'name' | 'issuer'> & { syncing: boolean };

const getFallbackInitial = (issuer: string): string => {
    if (issuer) {
        const firstChar = issuer.trim().match(/[a-zA-Z0-9]/);
        if (firstChar) return firstChar[0].toUpperCase();
    }

    return '-';
};

export const OtpLogo: FC<CodeLogoProps> = ({ issuer, syncing = false }) => {
    const fallback = useMemo(() => getFallbackInitial(issuer), [issuer]);
    const issuerInfo = useMemo(
        safeCall(() => issuerService.get_issuer_info(issuer)),
        [issuer]
    );

    return (
        <div className="relative shrink-0">
            {syncing && (
                <CircleLoader
                    size="small"
                    className="absolute top-custom right-custom bg-weak rounded-full p-1"
                    style={{ '--top-custom': '-4px', '--right-custom': '-4px' }}
                />
            )}
            <div className="item-image">
                {issuerInfo?.icon_url ? (
                    <img src={issuerInfo?.icon_url} alt={issuer || 'Issuer logo'} />
                ) : (
                    <div className="item-icon text-semibold">{fallback}</div>
                )}
            </div>
        </div>
    );
};
