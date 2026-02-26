import { type FC, useEffect, useState } from 'react';

import { c } from 'ttag';

import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import { presentListItem } from '@proton/pass/components/Item/List/utils';
import { SafeItemIcon } from '@proton/pass/components/Layout/Icon/ItemIcon';
import { PassModal } from '@proton/pass/components/Layout/Modal/PassModal';
import { useItem } from '@proton/pass/hooks/useItem';
import type { MaybeNull, SecureLink } from '@proton/pass/types';

import { SecureLinkDetails } from './SecureLinkDetails';
import { SecureLinkGenerate } from './SecureLinkGenerate';

type SecureLinkModalProps = ModalProps & {
    itemId: string;
    shareId: string;
    itemSecureLink?: MaybeNull<SecureLink>;
};

export const SecureLinkModal: FC<SecureLinkModalProps> = ({ itemId, shareId, itemSecureLink = null, ...props }) => {
    const [secureLink, setSecureLink] = useState<MaybeNull<SecureLink>>(null);
    const item = useItem(shareId, itemId);

    useEffect(() => {
        if (itemSecureLink) setSecureLink(itemSecureLink);
        else setTimeout(() => setSecureLink(itemSecureLink), 100); // Wait for the modal animation to finish
    }, [itemSecureLink]);

    if (!item) return;

    const { heading, subheading } = presentListItem(item);
    const key = `${secureLink ? 'details' : 'create'}`;

    return (
        <PassModal size="small" open enableCloseWhenClickOutside {...props} key={key}>
            <ModalTwoHeader
                key={`${key}-header`}
                title={c('Action').t`Share secure link`}
                subline={
                    <div className="flex flex-nowrap items-center gap-2 mt-1 mb-4">
                        <SafeItemIcon item={item} size={2.5} pill={false} />
                        <span className="text-ellipsis">
                            {heading}
                            {subheading && ` · ${subheading}`}
                        </span>
                    </div>
                }
            />

            {secureLink ? (
                <SecureLinkDetails {...secureLink} key={`${key}-details`} />
            ) : (
                <SecureLinkGenerate
                    itemId={itemId}
                    shareId={shareId}
                    onLinkGenerated={setSecureLink}
                    key={`${key}-create`}
                />
            )}
        </PassModal>
    );
};
