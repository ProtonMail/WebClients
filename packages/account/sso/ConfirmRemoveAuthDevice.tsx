import { format } from 'date-fns';
import { fromUnixTime } from 'date-fns';
import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Prompt, type PromptProps } from '@proton/components';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { dateLocale } from '@proton/shared/lib/i18n';
import type { AuthDeviceOutput } from '@proton/shared/lib/keys/device';

interface Props extends Omit<PromptProps, 'title' | 'buttons' | 'children'> {
    onConfirm: () => void;
    authDevice: AuthDeviceOutput;
}

const ConfirmRemoveAuthDevice = ({ onClose, onConfirm, authDevice, ...rest }: Props) => {
    const name = authDevice.Name;
    const date = format(fromUnixTime(authDevice.CreateTime), 'PPp', { locale: dateLocale });
    return (
        <Prompt
            title={c('Title').t`Remove device?`}
            buttons={[
                <Button
                    color="danger"
                    onClick={() => {
                        onConfirm();
                        onClose?.();
                    }}
                >{c('Action').t`Remove`}</Button>,
                <Button onClick={onClose}>{c('Action').t`Cancel`}</Button>,
            ]}
            onClose={onClose}
            {...rest}
        >
            <p className="text-break">
                {getBoldFormattedText(
                    c('Info')
                        .t`This will unlink the device **${name} (created at ${date})** from your ${BRAND_NAME} account.`
                )}
            </p>
        </Prompt>
    );
};

export default ConfirmRemoveAuthDevice;
