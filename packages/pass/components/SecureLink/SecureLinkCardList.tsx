import { type FC, useMemo, useState } from 'react';

import { useItemScope } from '@proton/pass/components/Navigation/NavigationMatches';
import { SecureLinkModal } from '@proton/pass/components/SecureLink/SecureLinkModal';
import { useMemoSelector } from '@proton/pass/hooks/useMemoSelector';
import { selectItemSecureLinks } from '@proton/pass/store/selectors';
import type { MaybeNull, SelectedItem } from '@proton/pass/types';
import { prop } from '@proton/pass/utils/fp/lens';

import { SecureLinkCard } from './SecureLinkCard';

export const SecureLinkCardList: FC<SelectedItem> = ({ shareId, itemId }) => {
    const scope = useItemScope();
    const [linkID, setLinkID] = useState<MaybeNull<string>>(null);
    const links = useMemoSelector(selectItemSecureLinks, [shareId, itemId]);
    const secureLinks = useMemo(
        () => (scope === 'secure-links' ? links : links.filter(prop('active'))),
        [scope, links]
    );

    const selectedSecureLink = useMemo(
        () => secureLinks?.find((link) => link.linkId === linkID),
        [linkID, secureLinks]
    );

    return (
        <>
            {secureLinks.map((secureLink) => (
                <SecureLinkCard key={secureLink.linkId} onClick={() => setLinkID(secureLink.linkId)} {...secureLink} />
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
