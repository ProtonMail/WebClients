import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import type { CryptoProcessingError } from '@proton/shared/lib/contacts/decrypt';
import type { ContactEmail, ContactGroup } from '@proton/shared/lib/interfaces/contacts/Contact';
import type { VCardContact } from '@proton/shared/lib/interfaces/contacts/VCard';

import type { ContactEmailSettingsProps } from '../email/ContactEmailSettingsModal';
import type { ContactGroupEditProps } from '../group/ContactGroupEditModal';
import ContactSummary from './ContactSummary';
import ContactViewErrors from './ContactViewErrors';
import ContactViewAdrs from './properties/ContactViewAdrs';
import ContactViewBdy from './properties/ContactViewBdy';
import ContactViewEmails from './properties/ContactViewEmails';
import ContactViewFns from './properties/ContactViewFns';
import ContactViewNotes from './properties/ContactViewNotes';
import ContactViewOthers from './properties/ContactViewOthers';
import ContactViewTels from './properties/ContactViewTels';

import './ContactView.scss';

interface Props {
    vCardContact: VCardContact;
    contactID: string;
    contactEmails: ContactEmail[];
    contactGroupsMap: { [contactGroupID: string]: ContactGroup };
    ownAddresses: string[];
    errors?: (CryptoProcessingError | Error)[];
    isSignatureVerified?: boolean;
    onReload: () => void;
    onEdit: (newField?: string) => void;
    onEmailSettings: (props: ContactEmailSettingsProps) => void;
    onGroupDetails: (contactGroupID: string) => void;
    onGroupEdit: (props: ContactGroupEditProps) => void;
    onUpgrade: () => void;
    onSignatureError: (contactID: string) => void;
    onDecryptionError: (contactID: string) => void;
    isPreview?: boolean;
}

const ShortcutButton = ({ onClick, label }: { onClick: () => void; label: string }) => (
    <div className="mb-2">
        <Button shape="outline" size="small" onClick={onClick}>
            {label}
        </Button>
    </div>
);

const ContactView = ({
    vCardContact,
    contactID,
    contactEmails,
    contactGroupsMap,
    ownAddresses,
    errors,
    isSignatureVerified = false,
    onReload,
    onEdit,
    onEmailSettings,
    onGroupDetails,
    onGroupEdit,
    onUpgrade,
    onSignatureError,
    onDecryptionError,
    isPreview = false,
}: Props) => {
    const hasEmail = vCardContact.email?.length || 0 > 0;
    const hasTel = vCardContact.tel?.length || 0 > 0;
    const hasAdr = vCardContact.adr?.length || 0 > 0;
    const hasNote = vCardContact.note?.length || 0 > 0;
    const hasBday = Boolean(vCardContact.bday);

    return (
        <div>
            <div className="contact-summary-wrapper border-bottom pb-4 mb-4">
                <ContactSummary
                    vCardContact={vCardContact}
                    leftBlockWidth="w-auto md:w-full max-w-custom"
                    style={{ '--max-w-custom': '6.25rem' }}
                />
                <ContactViewErrors
                    errors={errors}
                    onReload={onReload}
                    contactID={contactID}
                    onSignatureError={onSignatureError}
                    onDecryptionError={onDecryptionError}
                    isPreview={isPreview}
                />
            </div>
            <div>
                <ContactViewFns vCardContact={vCardContact} isSignatureVerified={isSignatureVerified} />
                <ContactViewEmails
                    vCardContact={vCardContact}
                    isSignatureVerified={isSignatureVerified}
                    isPreview={isPreview}
                    contactEmails={contactEmails}
                    contactGroupsMap={contactGroupsMap}
                    ownAddresses={ownAddresses}
                    contactID={contactID}
                    onEmailSettings={onEmailSettings}
                    onGroupDetails={onGroupDetails}
                    onUpgrade={onUpgrade}
                    onGroupEdit={onGroupEdit}
                />
                <ContactViewTels vCardContact={vCardContact} isSignatureVerified={isSignatureVerified} />
                <ContactViewAdrs vCardContact={vCardContact} isSignatureVerified={isSignatureVerified} />
                <ContactViewBdy vCardContact={vCardContact} isSignatureVerified={isSignatureVerified} />
                <ContactViewNotes vCardContact={vCardContact} isSignatureVerified={isSignatureVerified} />
                <ContactViewOthers vCardContact={vCardContact} isSignatureVerified={isSignatureVerified} />
            </div>
            {!isPreview ? (
                <div className="mt-6">
                    {hasEmail ? null : (
                        <ShortcutButton onClick={() => onEdit('email')} label={c('Action').t`Add email`} />
                    )}
                    {hasTel ? null : (
                        <ShortcutButton onClick={() => onEdit('tel')} label={c('Action').t`Add phone number`} />
                    )}
                    {hasAdr ? null : (
                        <ShortcutButton onClick={() => onEdit('adr')} label={c('Action').t`Add address`} />
                    )}
                    {hasBday ? null : (
                        <ShortcutButton onClick={() => onEdit('bday')} label={c('Action').t`Add birthday`} />
                    )}
                    {hasNote ? null : <ShortcutButton onClick={() => onEdit('note')} label={c('Action').t`Add note`} />}
                </div>
            ) : null}
        </div>
    );
};

export default ContactView;
