import { type FC, useMemo, useState } from 'react';

import { useMemoSelector } from '../../hooks/useMemoSelector';
import { selectItemSecureLinks } from '../../store/selectors';
import type { MaybeNull, SelectedItem } from '../../types';
import { prop } from '../../utils/fp/lens';
import { useItemScope } from '../Navigation/NavigationMatches';
import { SecureLinkCard } from './SecureLinkCard';
import { SecureLinkModal } from './SecureLinkModal';

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
