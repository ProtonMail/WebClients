import Toggle from '@proton/components/components/toggle/Toggle';
import { useUpdateMailSetting } from '@proton/mail/hooks/useUpdateMailSetting';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import { IMAGE_PROXY_FLAGS } from '@proton/shared/lib/mail/mailSettings';

interface Props {
    id: string;
    onEnable?: () => void;
}

const PreventTrackingToggle = ({ id, onEnable, ...rest }: Props) => {
    const [{ ImageProxy }] = useMailSettings();
    const { update, isLoading } = useUpdateMailSetting();
    const state = hasBit(ImageProxy, IMAGE_PROXY_FLAGS.PROXY);

    const handleChange = (checked: boolean) => {
        if (checked) {
            update('ImageProxy', { value: IMAGE_PROXY_FLAGS.PROXY, action: 'add' }, { onSuccess: onEnable });
            return;
        }

        // Both requests change ImageProxy and the response holds its whole new value: send them one after the other
        update(
            'ImageProxy',
            { value: IMAGE_PROXY_FLAGS.INCORPORATOR, action: 'remove' },
            {
                notify: false,
                onSuccess: () => update('ImageProxy', { value: IMAGE_PROXY_FLAGS.PROXY, action: 'remove' }),
            }
        );
    };

    return (
        <Toggle
            id={id}
            checked={state}
            onChange={({ target }) => handleChange(target.checked)}
            loading={isLoading('ImageProxy')}
            {...rest}
        />
    );
};

export default PreventTrackingToggle;
