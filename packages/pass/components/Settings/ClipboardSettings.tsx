import { type FC } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { c } from 'ttag';

import { InputFieldTwo, Option, SelectTwo } from '@proton/components/index';
import { settingsEditIntent } from '@proton/pass/store/actions/creators/settings';
import { selectClipboardTTL } from '@proton/pass/store/selectors';

import { SettingsPanel } from './SettingsPanel';

export const ClipboardSettings: FC = () => {
    const dispatch = useDispatch();
    const storedValue = useSelector(selectClipboardTTL);

    const options: [value: number, label: string][] = [
        [-1, c('Label').t`Never`],
        [15, c('Label').t`15 seconds`],
        [60, c('Label').t`1 minute`],
        [120, c('Label').t`2 minutes`],
    ];

    const value = options.find((o) => o[0] === storedValue)?.[0] ?? options[0][0];
    const onValue = (clipboardTTL: number) => dispatch(settingsEditIntent('security', { clipboardTTL }));

    return (
        <SettingsPanel title={c('Label').t`Clipboard`}>
            <InputFieldTwo
                as={SelectTwo<number>}
                onValue={onValue}
                value={value}
                label={c('Label').t`Clear clipboard after`}
                dense
            >
                {options.map(([value, label]) => (
                    <Option key={value} value={value} title={label} />
                ))}
            </InputFieldTwo>
        </SettingsPanel>
    );
};
