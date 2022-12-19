import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { CRYPTO_PROCESSING_TYPES } from '@proton/shared/lib/contacts/constants';
import { CryptoProcessingError } from '@proton/shared/lib/contacts/decrypt';
import { ContactEmail, ContactGroup } from '@proton/shared/lib/interfaces/contacts/Contact';
import { VCardContact } from '@proton/shared/lib/interfaces/contacts/VCard';

import { classnames } from '../../../helpers';
import { ContactEmailSettingsProps } from '../email/ContactEmailSettingsModal';
import { ContactGroupEditProps } from '../group/ContactGroupEditModal';
import ContactSummary from './ContactSummary';
import ContactViewErrors from './ContactViewErrors';
import ContactViewAdrs from './properties/ContactViewAdrs';
import ContactViewEmails from './properties/ContactViewEmails';
import ContactViewFns from './properties/ContactViewFns';
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
    onDelete: () => void;
    onReload: () => void;
    onEdit: (newField?: string) => void;
    onEmailSettings: (props: ContactEmailSettingsProps) => void;
    onExport: () => void;
    onGroupDetails: (contactGroupID: string) => void;
    onGroupEdit: (props: ContactGroupEditProps) => void;
    onUpgrade: () => void;
    onSignatureError: (contactID: string) => void;
    onDecryptionError: (contactID: string) => void;
    isPreview?: boolean;
}

const ContactView = ({
    vCardContact,
    contactID,
    contactEmails,
    contactGroupsMap,
    ownAddresses,
    errors,
    isSignatureVerified = false,
    onDelete,
    onReload,
    onEdit,
    onEmailSettings,
    onExport,
    onGroupDetails,
    onGroupEdit,
    onUpgrade,
    onSignatureError,
    onDecryptionError,
    isPreview = false,
}: Props) => {
    const hasError = errors?.some(
        (error) => error instanceof Error || error.type !== CRYPTO_PROCESSING_TYPES.SIGNATURE_NOT_VERIFIED
    );

    const hasEmail = vCardContact.email?.length || 0 > 0;
    const hasTel = vCardContact.tel?.length || 0 > 0;
    const hasAdr = vCardContact.adr?.length || 0 > 0;

    return (
        <div>
            <div className={classnames(['contact-summary-wrapper border-bottom pb1 mb1'])}>
                <ContactSummary
                    vCardContact={vCardContact}
                    onExport={onExport}
                    onDelete={onDelete}
                    leftBlockWidth="w100 max-w100p on-mobile-wauto"
                    isPreview={isPreview}
                    hasError={hasError}
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
                <ContactViewOthers vCardContact={vCardContact} isSignatureVerified={isSignatureVerified} />
            </div>
            {!isPreview ? (
                <div className={classnames(['mt1-5 '])}>
                    {hasEmail ? null : (
                        <div className="mb0-5">
                            <Button shape="outline" color="norm" onClick={() => onEdit('email')}>
                                {c('Action').t`Add email`}
                            </Button>
                        </div>
                    )}
                    {hasTel ? null : (
                        <div className="mb0-5">
                            <Button shape="outline" color="norm" onClick={() => onEdit('tel')}>
                                {c('Action').t`Add phone number`}
                            </Button>
                        </div>
                    )}
                    {hasAdr ? null : (
                        <div className="mb0-5">
                            <Button shape="outline" color="norm" onClick={() => onEdit('adr')}>
                                {c('Action').t`Add address`}
                            </Button>
                        </div>
                    )}
                </div>
            ) : null}
        </div>
    );
};

export default ContactView;
