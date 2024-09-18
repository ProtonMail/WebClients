import Toggle from '@proton/components/components/toggle/Toggle';
import { REMOVE_IMAGE_METADATA } from '@proton/shared/lib/mail/mailSettings';

interface Props {
    id?: string;
    removeImageMetadata: REMOVE_IMAGE_METADATA;
    onChange: (value: REMOVE_IMAGE_METADATA) => void;
    loading?: boolean;
}

const RemoveImageMetadataToggle = ({ id, removeImageMetadata, onChange, loading }: Props) => {
    return (
        <Toggle
            id={id}
            checked={removeImageMetadata === REMOVE_IMAGE_METADATA.ENABLED}
            loading={loading}
            onChange={({ target }) =>
                onChange(target.checked ? REMOVE_IMAGE_METADATA.ENABLED : REMOVE_IMAGE_METADATA.DISABLED)
            }
        />
    );
};

export default RemoveImageMetadataToggle;
