import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { formatImage } from '@proton/shared/lib/helpers/image';
import { VCardProperty } from '@proton/shared/lib/interfaces/contacts/VCard';

import { ContactImageProps } from '../../modals/ContactImageModal';

interface Props {
    vCardProperty: VCardProperty<string>;
    onChange: (vCardProperty: VCardProperty) => void;
    onSelectImage: (props: ContactImageProps) => void;
}

const ContactFieldImage = ({ vCardProperty, onChange, onSelectImage }: Props) => {
    const handleChangeImage = () => {
        const handleSubmit = (value: string) => onChange({ ...vCardProperty, value });
        onSelectImage({ url: vCardProperty.value, onSubmit: handleSubmit });
    };

    return (
        <div>
            {vCardProperty.value ? (
                <img className="max-w13e" alt="" src={formatImage(vCardProperty.value)} referrerPolicy="no-referrer" />
            ) : (
                <Button onClick={handleChangeImage}>{c('Action').t`Upload picture`}</Button>
            )}
        </div>
    );
};

export default ContactFieldImage;
