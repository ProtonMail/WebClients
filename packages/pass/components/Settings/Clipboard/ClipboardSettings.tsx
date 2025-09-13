import { type FC, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { Option, SelectTwo } from '@proton/components';
import { useSetClipboardTTL } from '@proton/pass/components/Settings/Clipboard/ClipboardProvider';
import { selectClipboardTTL } from '@proton/pass/store/selectors';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';

export const getClipboardTTLOptions = (): [ttl: number, label: string][] => [
    [-1, c('Label').t`Never`],
    [15_000, c('Label').t`15 seconds`],
    [60_000, c('Label').t`1 minute`],
    [120_000, c('Label').t`2 minutes`],
];

export const ClipboardSettings: FC = () => {
    const storedValue = useSelector(selectClipboardTTL);
    const setClipboardTTL = useSetClipboardTTL();

    const options = getClipboardTTLOptions();
    const value = useMemo(() => options.find(([ttl]) => ttl === storedValue)?.[0] ?? -1, [storedValue]);

    return (
        <>
            <SelectTwo onValue={setClipboardTTL} value={value}>
                {options.map(([ttl, label]) => (
                    <Option key={ttl} value={ttl} title={label} />
                ))}
            </SelectTwo>
            {value !== -1 && (
                <span className="block color-weak text-sm mt-2">
                    {DESKTOP_BUILD
                        ? c('Info').t`Please keep ${PASS_APP_NAME} open so the clipboard can be automatically cleared.`
                        : c('Info').t`Please keep your browser open so the clipboard can be automatically cleared.`}
                </span>
            )}
        </>
    );
};
