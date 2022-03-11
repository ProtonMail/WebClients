import { c } from 'ttag';
import { formatImage } from '@proton/shared/lib/helpers/image';
import { VCardProperty } from '@proton/shared/lib/interfaces/contacts/VCard';
import { Button } from '../../../../components';
import { useModals } from '../../../../hooks';
import ContactImageModal from '../../modals/ContactImageModal';

interface Props {
    vCardProperty: VCardProperty<string>;
    onChange: (vCardProperty: VCardProperty) => void;
}

const ContactFieldImage = ({ vCardProperty, onChange }: Props) => {
    const { createModal } = useModals();

    const handleChangeImage = () => {
        const handleSubmit = (value: string) => onChange({ ...vCardProperty, value });
        createModal(<ContactImageModal url={vCardProperty.value} onSubmit={handleSubmit} />);
    };

    return (
        <div>
            {vCardProperty.value ? (
                <img className="max-w13e" src={formatImage(vCardProperty.value)} referrerPolicy="no-referrer" />
            ) : (
                <Button onClick={handleChangeImage}>{c('Action').t`Upload picture`}</Button>
            )}
        </div>
    );
};

export default ContactFieldImage;
