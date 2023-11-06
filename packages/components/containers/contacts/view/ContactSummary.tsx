import React, { useRef, useState } from 'react';

import { c } from 'ttag';

import { getSortedProperties } from '@proton/shared/lib/contacts/properties';
import { validateEmailAddress } from '@proton/shared/lib/helpers/email';
import { formatImage } from '@proton/shared/lib/helpers/image';
import { VCardContact, VCardProperty, VcardNValue } from '@proton/shared/lib/interfaces/contacts/VCard';
import clsx from '@proton/utils/clsx';

import useActiveBreakpoint from '../../../hooks/useActiveBreakpoint';
import LoadRemoteImageBanner from '../../banner/LoadRemoteImageBanner';
import ContactImageSummary from './ContactImageSummary';

import './ContactSummary.scss';

interface Props {
    vCardContact: VCardContact;
    leftBlockWidth?: string;
    style?: React.CSSProperties;
}

const ContactSummary = ({ vCardContact, leftBlockWidth = 'w-1/3', style }: Props) => {
    const { isNarrow } = useActiveBreakpoint();
    const [showLoadImageBanner, setShowLoadImageBanner] = useState(false);
    const loadImageDirectRef = useRef<() => void>(null);

    const photo = formatImage(getSortedProperties(vCardContact, 'photo')[0]?.value || '');
    const displayName = getSortedProperties(vCardContact, 'fn')[0]?.value || '';
    const nameProperty = getSortedProperties(vCardContact, 'n')[0] as VCardProperty<VcardNValue>;
    const givenName = nameProperty?.value?.givenNames.join(' ').trim() || '';
    const familyName = nameProperty?.value?.familyNames.join(' ').trim() || '';
    const computedName = `${givenName} ${familyName}`;

    const nameIsEmail = validateEmailAddress(displayName);

    return (
        <>
            {showLoadImageBanner && (
                <LoadRemoteImageBanner
                    onClick={() => loadImageDirectRef.current?.()}
                    text={c('Action').t`Image could not be loaded with tracker protection.`}
                    tooltip={c('Action').t`Image will be loaded without a proxy`}
                    actionText={c('Action').t`Load`}
                />
            )}
            <div
                className={clsx(
                    'contactsummary-container my-4',
                    !isNarrow && 'flex flex-nowrap flex-align-items-center'
                )}
            >
                <div
                    className={clsx(
                        'text-center contactsummary-photo-container pt-2 mb-2 md:mb-0 mx-auto md:mx-0',
                        leftBlockWidth
                    )}
                    style={style}
                >
                    <ContactImageSummary
                        photo={photo}
                        name={displayName}
                        loadImageDirectRef={loadImageDirectRef}
                        onToggleLoadDirectBanner={setShowLoadImageBanner}
                    />
                </div>
                <div className="contactsummary-contact-name-container pl-0 md:pl-7 flex-column">
                    <h2
                        className={clsx(
                            'contactsummary-contact-name text-center md:text-right mb-4 md:mb-0 flex-item-fluid text-bold text-ellipsis-two-lines w-full',
                            // Several email addresses are a single word but too long, for this case, we break at any char
                            nameIsEmail && 'text-break'
                        )}
                        title={displayName}
                    >
                        {displayName}
                    </h2>
                    <h3 className="color-weak text-ellipsis" style={{ whiteSpace: 'break-spaces' }}>
                        {computedName}
                    </h3>
                </div>
            </div>
        </>
    );
};

export default ContactSummary;
