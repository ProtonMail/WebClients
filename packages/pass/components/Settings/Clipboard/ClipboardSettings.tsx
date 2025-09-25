import { type FC, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { Option, SelectTwo } from '@proton/components';
import { useSetClipboardTTL } from '@proton/pass/components/Settings/Clipboard/ClipboardProvider';
import { ClipboardTTL, DEFAULT_CLIPBOARD_TTL } from '@proton/pass/lib/clipboard/types';
import { selectClipboardTTL } from '@proton/pass/store/selectors';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';

export const getClipboardTTLOptions = (): Map<ClipboardTTL, string> =>
    new Map([
        [ClipboardTTL.TTL_NEVER, c('Label').t`Never`],
        [ClipboardTTL.TTL_15_SEC, c('Label').t`15 seconds`],
        [ClipboardTTL.TTL_1_MIN, c('Label').t`1 minute`],
        [ClipboardTTL.TTL_2_MIN, c('Label').t`2 minutes`],
    ]);

export const getDefaultClipboardTTLOption = () => getClipboardTTLOptions().get(DEFAULT_CLIPBOARD_TTL);

type Props = { disabled?: boolean };

export const ClipboardSettings: FC<Props> = ({ disabled = false }) => {
    const storedValue = useSelector(selectClipboardTTL);
    const setClipboardTTL = useSetClipboardTTL();

    const options = useMemo(() => Array.from(getClipboardTTLOptions().entries()), []);
    const value = useMemo(() => storedValue ?? ClipboardTTL.TTL_NEVER, [storedValue]);

    return (
        <>
            <SelectTwo<ClipboardTTL> onValue={setClipboardTTL} value={value} disabled={disabled}>
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
