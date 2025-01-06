import Toggle from '@proton/components/components/toggle/Toggle';

interface Props {
    id?: string;
    removeImageMetadata: boolean;
    onChange: (value: boolean) => void;
    loading?: boolean;
}

const RemoveImageMetadataToggle = ({ id, removeImageMetadata, onChange, loading }: Props) => {
    return (
        <Toggle
            id={id}
            checked={!!removeImageMetadata}
            loading={loading}
            onChange={({ target }) => onChange(!!target.checked)}
        />
    );
};

export default RemoveImageMetadataToggle;
