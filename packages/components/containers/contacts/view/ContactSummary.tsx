import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { getSortedProperties } from '@proton/shared/lib/contacts/properties';
import { validateEmailAddress } from '@proton/shared/lib/helpers/email';
import { formatImage } from '@proton/shared/lib/helpers/image';
import { VCardContact } from '@proton/shared/lib/interfaces/contacts/VCard';

import { Icon, Tooltip } from '../../../components';
import { classnames } from '../../../helpers';
import useActiveBreakpoint from '../../../hooks/useActiveBreakpoint';
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

    const photo = formatImage(getSortedProperties(vCardContact, 'photo')[0]?.value || '');
    const name = getSortedProperties(vCardContact, 'fn')[0]?.value || '';

    const nameIsEmail = validateEmailAddress(name);

    return (
        <div
            className={classnames([
                'contactsummary-container mt1 mb1',
                !isNarrow && 'flex flex-nowrap flex-align-items-center',
            ])}
        >
            <div
                className={classnames([
                    'text-center contactsummary-photo-container pt0-5 on-mobile-mb0-5 on-mobile-center',
                    leftBlockWidth,
                ])}
            >
                <ContactImageSummary photo={photo} name={name} />
            </div>
            <div className="contactsummary-contact-name-container pl2 on-mobile-pl0 flex-no-min-children flex-item-fluid">
                <h2
                    className={classnames([
                        'contactsummary-contact-name on-mobile-text-center mb0 flex-item-fluid on-mobile-mb1 text-bold text-ellipsis-two-lines',
                        // Several email addresses are a single word but too long, for this case, we break at any char
                        nameIsEmail && 'text-break',
                    ])}
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
                                    className="inline-flex ml0-5"
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
                                className="inline-flex ml0-5"
                                data-testid="contact-summary:delete"
                            >
                                <Icon name="trash" alt={c('Action').t`Delete`} />
                            </Button>
                        </Tooltip>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ContactSummary;
