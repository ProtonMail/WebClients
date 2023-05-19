import { type VFC } from 'react';
import { useDispatch } from 'react-redux';

import { c } from 'ttag';

import { InputFieldTwo, Option, SelectTwo } from '@proton/components/index';
import { sessionLockEnableIntent } from '@proton/pass/store';

import { useSessionLockConfirmContext } from './SessionLockConfirmContextProvider';

type Props = {
    ttl?: number;
    disabled?: boolean;
};

const getSessionLockTTLOptions = () => [
    { title: c('Label').t`30 seconds`, value: 30 },
    { title: c('Label').t`1 minute`, value: 60 },
    { title: c('Label').t`5 minutes`, value: 300 },
    { title: c('Label').t`10 minutes`, value: 600 },
    { title: c('Label').t`15 minutes`, value: 900 },
    { title: c('Label').t`30 minutes`, value: 1800 },
    { title: c('Label').t`1 hour`, value: 3600 },
];

export const SessionLockTTLUpdate: VFC<Props> = ({ ttl, disabled }) => {
    const dispatch = useDispatch();
    const { confirmPin } = useSessionLockConfirmContext();

    const handleOnChange = async (ttl: number) =>
        confirmPin({
            onSubmit: (pin) => dispatch(sessionLockEnableIntent({ pin, ttl })),
            title: c('Title').t`Auto-lock update`,
            assistiveText: c('Info').t`Please confirm your PIN code to edit this setting.`,
        });

    return (
        <InputFieldTwo
            as={SelectTwo<number>}
            label={c('Label').t`Auto-lock after`}
            disabled={disabled}
            placeholder={c('Label').t`15 minutes`}
            onValue={handleOnChange}
            value={ttl}
            dense
        >
            {getSessionLockTTLOptions().map(({ title, value }) => (
                <Option key={value} title={title} value={value} />
            ))}
        </InputFieldTwo>
    );
};
