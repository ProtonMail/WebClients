import { ChangeEvent } from 'react';
import { c } from 'ttag';
import { updateImageProxy } from '@proton/shared/lib/api/mailSettings';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import { useToggle, useEventManager, useApiWithoutResult, useNotifications, useMailSettings } from '../../hooks';
import { Toggle } from '../../components';

interface Props {
    id: string;
    className?: string;
    bit: number;
}

const ImageProxyToggle = ({ id, className, bit }: Props) => {
    const { call } = useEventManager();
    const [{ ImageProxy } = { ImageProxy: 0 }] = useMailSettings();
    const { createNotification } = useNotifications();
    const { request, loading } = useApiWithoutResult(updateImageProxy);
    const { state, toggle } = useToggle(hasBit(ImageProxy, bit));

    const handleChange = async ({ target }: ChangeEvent<HTMLInputElement>) => {
        await request(bit, target.checked ? 'add' : 'remove');
        void call();
        toggle();
        createNotification({ text: c('Success').t`Spy tracker preference updated` });
    };

    return <Toggle id={id} className={className} checked={state} onChange={handleChange} loading={loading} />;
};

export default ImageProxyToggle;
