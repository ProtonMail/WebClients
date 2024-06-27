import { type FC, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import { SecureLinkModal } from '@proton/pass/components/SecureLink/SecureLinkModal';
import { selectItemSecureLinks } from '@proton/pass/store/selectors';
import type { MaybeNull, SelectedItem } from '@proton/pass/types';

import { SecureLinkCard } from './SecureLinkCard';

export const SecureLinkCardList: FC<SelectedItem> = ({ shareId, itemId }) => {
    const [linkID, setLinkID] = useState<MaybeNull<string>>(null);
    const secureLinks = useSelector(selectItemSecureLinks(shareId, itemId));

    const selectedSecureLink = useMemo(
        () => secureLinks?.find((link) => link.linkId === linkID),
        [linkID, secureLinks]
    );

    return (
        <>
            {secureLinks?.map((secureLink) => (
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
