/* eslint-disable deprecation/deprecation */
import { type VFC, useEffect, useRef, useState } from 'react';

import { PauseListDropdown } from 'proton-pass-extension/app/content/injections/apps/common/PauseListDropdown';
import { DropdownHeader } from 'proton-pass-extension/app/content/injections/apps/dropdown/components/DropdownHeader';
import { DropdownItem } from 'proton-pass-extension/app/content/injections/apps/dropdown/components/DropdownItem';
import type { IFrameCloseOptions, IFrameMessage } from 'proton-pass-extension/app/content/types';
import { IFrameMessageType } from 'proton-pass-extension/app/content/types';
import { c } from 'ttag';

import { SubTheme } from '@proton/pass/components/Layout/Theme/types';
import { getCharsGroupedByColor } from '@proton/pass/hooks/usePasswordGenerator';
import type { GeneratePasswordOptions } from '@proton/pass/lib/password/generator';
import { generatePassword } from '@proton/pass/lib/password/generator';
import { type Maybe } from '@proton/pass/types';

type Props = {
    hostname: string;
    passwordOptions: GeneratePasswordOptions;
    visible?: boolean;
    onClose?: (options?: IFrameCloseOptions) => void;
    onMessage?: (message: IFrameMessage) => void;
};

export const PasswordAutoSuggest: VFC<Props> = ({ hostname, passwordOptions, visible, onMessage, onClose }) => {
    const timer = useRef<Maybe<ReturnType<typeof setTimeout>>>();
    const inputRef = useRef<HTMLInputElement>(null);
    const password = generatePassword(passwordOptions);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (copied) timer.current = setTimeout(() => onClose?.(), 1_500);
        return () => clearTimeout(timer.current);
    }, [copied]);

    useEffect(() => setCopied(false), [visible]);

    /* FIXME: move away from from `execCommand` and
     * prefer `navigator.clipboard` API  */
    const handleClick = async () => {
        inputRef.current?.select();
        document.execCommand('copy');

        setCopied(true);
        onMessage?.({
            type: IFrameMessageType.DROPDOWN_AUTOFILL_GENERATED_PW,
            payload: { password },
        });
    };

    return (
        <>
            <DropdownHeader
                title={c('Title').t`Password`}
                extra={
                    <PauseListDropdown
                        criteria="Autosuggest"
                        dense
                        hostname={hostname}
                        label={c('Action').t`Do not suggest on this website`}
                        onClose={onClose}
                        visible={visible}
                    />
                }
            />

            <DropdownItem
                subTheme={SubTheme.RED}
                {...(copied
                    ? {
                          icon: 'checkmark',
                          subTitle: c('Info').t`Password copied`,
                          onClick: () => onClose?.(),
                      }
                    : {
                          icon: 'key',
                          title: c('Title').t`Fill & copy password`,
                          subTitle: <span className="text-monospace">{getCharsGroupedByColor(password)}</span>,
                          onClick: handleClick,
                      })}
            />
            <input ref={inputRef} className="absolute" style={{ top: -9999, left: -9990 }} value={password} readOnly />
        </>
    );
};
