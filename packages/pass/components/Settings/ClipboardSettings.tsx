import { type FC, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { c } from 'ttag';

import { Option, SelectTwo } from '@proton/components/index';
import { setDesktopSettings } from '@proton/pass/store/actions/creators/desktop';
import { selectClipboardTTL } from '@proton/pass/store/selectors';

import { SettingsPanel } from './SettingsPanel';

export const ClipboardSettings: FC = () => {
    const dispatch = useDispatch();
    const storedValue = useSelector(selectClipboardTTL);

    const options: [value: number, label: string][] = [
        [-1, c('Label').t`Never`],
        [15_000, c('Label').t`15 seconds`],
        [60_000, c('Label').t`1 minute`],
        [120_000, c('Label').t`2 minutes`],
    ];

    const value = useMemo(() => options.find(([value]) => value === storedValue)?.[0] ?? options[0][0], [storedValue]);

    const onValue = (timeoutMs: number) => dispatch(setDesktopSettings.intent({ clipboard: { timeoutMs } }));

    return (
        <SettingsPanel title={c('Label').t`Clear clipboard after`}>
            <SelectTwo onValue={onValue} value={value}>
                {options.map(([value, label]) => (
                    <Option key={value} value={value} title={label} />
                ))}
            </SelectTwo>
        </SettingsPanel>
    );
};
