import { c } from 'ttag';

import Select from '@proton/components/components/select/Select';
import { useUpdateMailSetting } from '@proton/mail/hooks/useUpdateMailSetting';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { IMAGE_PROXY_FLAGS } from '@proton/shared/lib/mail/mailSettings';

interface Props {
    id: string;
}

const ProtectionModeSelect = ({ id, ...rest }: Props) => {
    const [{ ImageProxy }] = useMailSettings();
    const { update, isLoading } = useUpdateMailSetting();

    const options = [
        { text: c('Option protection mode').t`Load content via proxy (recommended)`, value: IMAGE_PROXY_FLAGS.PROXY },
        {
            text: c('Option protection mode').t`Load content via proxy and store as attachments`,
            value: IMAGE_PROXY_FLAGS.ALL,
        },
    ];

    const handleChange = (mode: number) => {
        update('ImageProxy', {
            value: IMAGE_PROXY_FLAGS.INCORPORATOR,
            action: mode === IMAGE_PROXY_FLAGS.PROXY ? 'remove' : 'add',
        });
    };

    return (
        <Select
            id={id}
            value={ImageProxy}
            options={options}
            onChange={({ target }) => handleChange(+target.value)}
            loading={isLoading('ImageProxy')}
            {...rest}
        />
    );
};

export default ProtectionModeSelect;
