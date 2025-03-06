import { type FC, useMemo, useState } from 'react';

import { SecureLinkModal } from '@proton/pass/components/SecureLink/SecureLinkModal';
import { useMemoSelector } from '@proton/pass/hooks/useMemoSelector';
import { selectItemSecureLinks } from '@proton/pass/store/selectors';
import type { MaybeNull, SelectedItem } from '@proton/pass/types';
import { prop } from '@proton/pass/utils/fp/lens';

import { SecureLinkCard } from './SecureLinkCard';

export const SecureLinkCardList: FC<SelectedItem> = ({ shareId, itemId }) => {
    const [linkID, setLinkID] = useState<MaybeNull<string>>(null);
    const secureLinks = useMemoSelector(selectItemSecureLinks, [shareId, itemId]);

    const selectedSecureLink = useMemo(
        () => secureLinks?.find((link) => link.linkId === linkID),
        [linkID, secureLinks]
    );

    return (
        <>
            {secureLinks
                ?.filter(prop('active'))
                .map((secureLink) => (
                    <SecureLinkCard
                        key={secureLink.linkId}
                        onClick={() => setLinkID(secureLink.linkId)}
                        {...secureLink}
                    />
                ))}

            {selectedSecureLink && (
                <SecureLinkModal
                    shareId={shareId}
                    itemId={itemId}
                    onClose={() => setLinkID(null)}
                    itemSecureLink={selectedSecureLink}
                />
            )}
        </>
    );
};
