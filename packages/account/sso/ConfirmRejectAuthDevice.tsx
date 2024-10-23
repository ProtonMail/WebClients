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
    pendingAuthDevice: AuthDeviceOutput;
}

const ConfirmRejectAuthDevice = ({ onClose, onConfirm, pendingAuthDevice, ...rest }: Props) => {
    const name = pendingAuthDevice.Name;
    const date = format(fromUnixTime(pendingAuthDevice.CreateTime), 'PPp', { locale: dateLocale });
    return (
        <Prompt
            title={c('Title').t`Reject device?`}
            buttons={[
                <Button
                    color="danger"
                    onClick={() => {
                        onConfirm();
                        onClose?.();
                    }}
                >{c('Action').t`Reject`}</Button>,
                <Button onClick={onClose}>{c('Action').t`Cancel`}</Button>,
            ]}
            onClose={onClose}
            {...rest}
        >
            <p className="text-break">
                {getBoldFormattedText(
                    c('Info')
                        .t`This will reject the device **${name}** that tried signing into your ${BRAND_NAME} account on **${date}**.`
                )}
            </p>
        </Prompt>
    );
};

export default ConfirmRejectAuthDevice;
