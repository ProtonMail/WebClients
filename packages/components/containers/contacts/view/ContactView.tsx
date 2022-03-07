import { CRYPTO_PROCESSING_TYPES } from '@proton/shared/lib/contacts/constants';
import { ContactProperties, ContactEmail, ContactGroup } from '@proton/shared/lib/interfaces/contacts/Contact';
import { DecryptedKey } from '@proton/shared/lib/interfaces';
import { CryptoProcessingError } from '@proton/shared/lib/contacts/decrypt';
import { singleExport } from '@proton/shared/lib/contacts/helpers/export';
import { c } from 'ttag';
import { VCardContact } from '@proton/shared/lib/interfaces/contacts/VCard';
import { useModals } from '../../../hooks';
import { classnames } from '../../../helpers';
import ContactModal from '../modals/ContactModal';
import ContactDeleteModal from '../modals/ContactDeleteModal';
import ContactViewErrors from './ContactViewErrors';
import ContactSummary from './ContactSummary';
import { Button } from '../../../components';
import ContactViewFns from './properties/ContactViewFns';
import ContactViewEmails from './properties/ContactViewEmails';
import ContactViewTels from './properties/ContactViewTels';
import ContactViewAdrs from './properties/ContactViewAdrs';
import ContactViewOthers from './properties/ContactViewOthers';

import './ContactView.scss';

interface Props {
    vCardContact: VCardContact;
    contactID: string;
    contactEmails: ContactEmail[];
    contactGroupsMap: { [contactGroupID: string]: ContactGroup };
    ownAddresses: string[];
    properties: ContactProperties;
    userKeysList: DecryptedKey[];
    errors?: (CryptoProcessingError | Error)[];
    isSignatureVerified?: boolean;
    onDelete: () => void;
    onReload: () => void;
    isPreview?: boolean;
}

const ContactView = ({
    vCardContact,
    properties = [],
    contactID,
    contactEmails,
    contactGroupsMap,
    ownAddresses,
    userKeysList,
    errors,
    isSignatureVerified = false,
    onDelete,
    onReload,
    isPreview = false,
}: Props) => {
    const { createModal } = useModals();

    const handleDelete = () => {
        createModal(<ContactDeleteModal contactIDs={[contactID]} onDelete={onDelete} />);
    };

    const handleEdit = (field?: string) => {
        createModal(<ContactModal properties={properties} contactID={contactID} newField={field} />);
    };

    const handleExport = () => singleExport(properties);

    const hasError = errors?.some(
        (error) => error instanceof Error || error.type !== CRYPTO_PROCESSING_TYPES.SIGNATURE_NOT_VERIFIED
    );

    const { hasEmail, hasTel, hasAdr } = properties.reduce<{ hasEmail: boolean; hasTel: boolean; hasAdr: boolean }>(
        (acc, { field }) => {
            acc.hasEmail = acc.hasEmail || field === 'email';
            acc.hasTel = acc.hasTel || field === 'tel';
            acc.hasAdr = acc.hasAdr || field === 'adr';
            return acc;
        },
        {
            hasEmail: false,
            hasTel: false,
            hasAdr: false,
        }
    );

    return (
        <div>
            <div className={classnames(['contact-summary-wrapper border-bottom pb1 mb1'])}>
                <ContactSummary
                    vCardContact={vCardContact}
                    onExport={handleExport}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    leftBlockWidth="w100 max-w100p on-mobile-wauto"
                    isPreview={isPreview}
                    hasError={hasError}
                />
                <ContactViewErrors errors={errors} onReload={onReload} contactID={contactID} />
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
                    userKeysList={userKeysList}
                    contactID={contactID}
                    properties={properties}
                />
                <ContactViewTels vCardContact={vCardContact} isSignatureVerified={isSignatureVerified} />
                <ContactViewAdrs vCardContact={vCardContact} isSignatureVerified={isSignatureVerified} />
                <ContactViewOthers vCardContact={vCardContact} isSignatureVerified={isSignatureVerified} />
            </div>
            <div className={classnames(['mt1-5 '])}>
                {hasEmail ? null : (
                    <div className="mb0-5">
                        <Button shape="outline" color="norm" onClick={() => handleEdit('email')}>
                            {c('Action').t`Add email`}
                        </Button>
                    </div>
                )}
                {hasTel ? null : (
                    <div className="mb0-5">
                        <Button shape="outline" color="norm" onClick={() => handleEdit('tel')}>
                            {c('Action').t`Add phone number`}
                        </Button>
                    </div>
                )}
                {hasAdr ? null : (
                    <div className="mb0-5">
                        <Button shape="outline" color="norm" onClick={() => handleEdit('adr')}>
                            {c('Action').t`Add address`}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ContactView;
