import { c } from 'ttag';

import { useUpdateMailSetting } from '@proton/mail/hooks/useUpdateMailSetting';
import { DELAY_IN_SECONDS } from '@proton/shared/lib/mail/mailSettings';

import Select from '../../components/select/Select';

interface Props {
    id: string;
    delaySendSeconds: number;
}

const DelaySendSecondsSelect = ({ id, delaySendSeconds }: Props) => {
    const { update, isLoading } = useUpdateMailSetting();
    const options = [
        { text: c('Option delay send seconds').t`0 seconds`, value: DELAY_IN_SECONDS.NONE },
        { text: c('Option delay send seconds').t`5 seconds`, value: DELAY_IN_SECONDS.SMALL },
        { text: c('Option delay send seconds').t`10 seconds`, value: DELAY_IN_SECONDS.MEDIUM },
        { text: c('Option delay send seconds').t`20 seconds`, value: DELAY_IN_SECONDS.LARGE },
    ];

    const handleChange = (delay: number) => {
        update('DelaySendSeconds', delay);
    };

    return (
        <Select
            id={id}
            value={delaySendSeconds}
            options={options}
            onChange={({ target }) => handleChange(+target.value)}
            loading={isLoading('DelaySendSeconds')}
        />
    );
};

export default DelaySendSecondsSelect;
