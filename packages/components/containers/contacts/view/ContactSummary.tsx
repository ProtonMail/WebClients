import { useRef, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { getSortedProperties } from '@proton/shared/lib/contacts/properties';
import { validateEmailAddress } from '@proton/shared/lib/helpers/email';
import { formatImage } from '@proton/shared/lib/helpers/image';
import { VCardContact } from '@proton/shared/lib/interfaces/contacts/VCard';
import clsx from '@proton/utils/clsx';

import { Icon, Tooltip } from '../../../components';
import useActiveBreakpoint from '../../../hooks/useActiveBreakpoint';
import LoadRemoteImageBanner from '../../banner/LoadRemoteImageBanner';
import ContactImageSummary from './ContactImageSummary';

import './ContactSummary.scss';

interface Props {
    vCardContact: VCardContact;
    onExport: () => void;
    onDelete: () => void;
    leftBlockWidth?: string;
    isPreview?: boolean;
    hasError?: boolean;
}

const ContactSummary = ({
    vCardContact,
    onDelete,
    onExport,
    isPreview,
    leftBlockWidth = 'w30',
    hasError = false,
}: Props) => {
    const { isNarrow } = useActiveBreakpoint();
    const [showLoadImageBanner, setShowLoadImageBanner] = useState(false);
    const loadImageDirectRef = useRef<() => void>(null);

    const photo = formatImage(getSortedProperties(vCardContact, 'photo')[0]?.value || '');
    const name = getSortedProperties(vCardContact, 'fn')[0]?.value || '';

    const nameIsEmail = validateEmailAddress(name);

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
                        'text-center contactsummary-photo-container pt-2 mb-2 md:mb-0 on-mobile-center',
                        leftBlockWidth
                    )}
                >
                    <ContactImageSummary
                        photo={photo}
                        name={name}
                        loadImageDirectRef={loadImageDirectRef}
                        onToggleLoadDirectBanner={setShowLoadImageBanner}
                    />
                </div>
                <div className="contactsummary-contact-name-container pl-0 md:pl-7 flex-no-min-children flex-item-fluid">
                    <h2
                        className={clsx(
                            'contactsummary-contact-name on-mobile-text-center mb-4 md:mb-0 flex-item-fluid text-bold text-ellipsis-two-lines',
                            // Several email addresses are a single word but too long, for this case, we break at any char
                            nameIsEmail && 'text-break'
                        )}
                        title={name}
                    >
                        {name}
                    </h2>
                    {!isPreview && (
                        <div className="contactsummary-action-buttons flex-item-noshrink on-mobile-text-center ">
                            {!hasError && (
                                <Tooltip title={c('Action').t`Export`}>
                                    <Button
                                        color="weak"
                                        shape="outline"
                                        icon
                                        onClick={onExport}
                                        className="inline-flex ml-2"
                                        data-testid="contact-summary:export"
                                    >
                                        <Icon name="arrow-up-from-square" alt={c('Action').t`Export`} />
                                    </Button>
                                </Tooltip>
                            )}

                            <Tooltip title={c('Action').t`Delete`}>
                                <Button
                                    color="weak"
                                    shape="outline"
                                    icon
                                    onClick={onDelete}
                                    className="inline-flex ml-2"
                                    data-testid="contact-summary:delete"
                                >
                                    <Icon name="trash" alt={c('Action').t`Delete`} />
                                </Button>
                            </Tooltip>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default ContactSummary;
