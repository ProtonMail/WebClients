import { type FC, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { Option, SelectTwo } from '@proton/components';
import { useOnClipboardSettingsChange } from '@proton/pass/components/Settings/Clipboard/ClipboardProvider';
import { selectClipboardTTL } from '@proton/pass/store/selectors';

type Props = {
    // Whether or not to initialize the settings value even if there is no changes
    initializeSetting?: boolean;
};

export const ClipboardSettings: FC<Props> = ({ initializeSetting = false }) => {
    const storedValue = useSelector(selectClipboardTTL);
    const onSettingsChange = useOnClipboardSettingsChange();

    const options: [value: number, label: string][] = [
        [-1, c('Label').t`Never`],
        [15_000, c('Label').t`15 seconds`],
        [60_000, c('Label').t`1 minute`],
        [120_000, c('Label').t`2 minutes`],
    ];

    const value = useMemo(() => options.find(([value]) => value === storedValue)?.[0] ?? options[0][0], [storedValue]);

    useEffect(() => {
        if (initializeSetting && storedValue === undefined) {
            const timeoutMs = options[0][0];
            void onSettingsChange(timeoutMs, true);
        }
    }, [initializeSetting, storedValue]);

    return (
        <>
            <SelectTwo onValue={onSettingsChange} value={value}>
                {options.map(([value, label]) => (
                    <Option key={value} value={value} title={label} />
                ))}
            </SelectTwo>
            {value !== -1 && (
                <span className="block color-weak text-sm">
                    {c('Info').t`Please keep your browser open so the clipboard can be cleared automatically.`}
                </span>
            )}
        </>
    );
};
