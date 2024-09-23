import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import RemoteImage from '@proton/components/components/image/RemoteImage';
import type { ContactImageProps } from '@proton/components/containers/contacts/modals/ContactImageModal';
import type { VCardProperty } from '@proton/shared/lib/interfaces/contacts/VCard';

interface Props {
    vCardProperty: VCardProperty<string>;
    onChange: (vCardProperty: VCardProperty) => void;
    onSelectImage: (props: ContactImageProps) => void;
}

const ContactFieldImage = ({ vCardProperty, onChange, onSelectImage }: Props) => {
    const [loadNewImage, setLoadNewImage] = useState(false);

    const handleChangeImage = () => {
        const handleSubmit = (value: string) => {
            onChange({ ...vCardProperty, value });
            setLoadNewImage(true);
        };
        onSelectImage({ url: vCardProperty.value, onSubmit: handleSubmit });
    };

    /**
     * Load image by default in edit mode
     * AND allow image update when "default" contact photo is deleted
     * In that case, photo from "Other" field will become the contact photo (if any).
     * But we need to reload them, using this useEffect
     */
    useEffect(() => {
        if (vCardProperty.value) {
            setLoadNewImage(true);
        }
    }, [vCardProperty.value]);

    return (
        <div>
            {vCardProperty.value ? (
                <RemoteImage src={vCardProperty.value} autoLoad={loadNewImage} />
            ) : (
                <Button onClick={handleChangeImage}>{c('Action').t`Upload picture`}</Button>
            )}
        </div>
    );
};

export default ContactFieldImage;
