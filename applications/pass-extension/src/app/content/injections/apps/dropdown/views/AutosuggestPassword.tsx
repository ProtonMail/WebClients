import { type FC, useCallback, useEffect, useRef, useState } from 'react';

import { useIFrameContext } from 'proton-pass-extension/app/content/injections/apps/components/IFrameApp';
import { ListItem } from 'proton-pass-extension/app/content/injections/apps/components/ListItem';
import { PauseListDropdown } from 'proton-pass-extension/app/content/injections/apps/components/PauseListDropdown';
import { DropdownHeader } from 'proton-pass-extension/app/content/injections/apps/dropdown/components/DropdownHeader';
import {
    type DropdownAction,
    type DropdownActions,
    IFramePortMessageType,
} from 'proton-pass-extension/app/content/types';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Icon } from '@proton/components';
import { SubTheme } from '@proton/pass/components/Layout/Theme/types';
import { PasswordMemorableOptions } from '@proton/pass/components/Password/PasswordMemorableOptions';
import { PasswordRandomOptions } from '@proton/pass/components/Password/PasswordRandomOptions';
import { PasswordTypeSelect } from '@proton/pass/components/Password/PasswordTypeSelect';
import {
    getCharsGroupedByColor,
    isUsingMemorablePassword,
    isUsingRandomPassword,
    usePasswordGenerator,
} from '@proton/pass/hooks/usePasswordGenerator';
import { type Maybe } from '@proton/pass/types';
import noop from '@proton/utils/noop';

type Props = Extract<DropdownActions, { action: DropdownAction.AUTOSUGGEST_PASSWORD }>;

export const AutosuggestPassword: FC<Props> = ({ domain, config: initial, copy }) => {
    const { visible, forwardMessage, close } = useIFrameContext();
    const timer = useRef<Maybe<ReturnType<typeof setTimeout>>>();
    const inputRef = useRef<HTMLInputElement>(null);

    const [advanced, setAdvanced] = useState(false);
    const [copied, setCopied] = useState(false);

    const generator = usePasswordGenerator({ initial, onConfigChange: noop });

    useEffect(() => {
        setCopied(false);
        setAdvanced(false);
        return () => clearTimeout(timer.current);
    }, [visible]);

    /* FIXME: move away from from `execCommand` and
     * prefer `navigator.clipboard` API  */
    const copyToClipboard = useCallback(() => {
        inputRef.current?.select();
        document.execCommand('copy');
        setCopied(true);
    }, []);

    const autofillPassword = (feedback: boolean) => {
        forwardMessage({
            type: IFramePortMessageType.DROPDOWN_AUTOFILL_GENERATED_PW,
            payload: { password: generator.password },
        });

        if (copy) copyToClipboard();
        if (feedback) timer.current = setTimeout(close, 1_000);
        else close();
    };

    const label = copy ? c('Title').t`Fill & copy password` : c('Title').t`Fill password`;

    return (
        <>
            <DropdownHeader
                title={c('Title').t`Password`}
                extra={
                    <div className="flex gap-1">
                        <Button
                            className="shrink-0 button-xs"
                            icon
                            color="weak"
                            shape="solid"
                            pill
                            onClick={() => setAdvanced((prev) => !prev)}
                            size="small"
                            title={c('Action').t`Show advanced options`}
                        >
                            <Icon name="cog-drawer" alt={c('Action').t`More options`} size={12} />
                        </Button>
                        <PauseListDropdown
                            criteria="Autosuggest"
                            dense
                            hostname={domain}
                            label={c('Action').t`Do not suggest on this website`}
                        />
                    </div>
                }
            />

            <ListItem
                subTheme={SubTheme.RED}
                {...(copied
                    ? {
                          icon: 'checkmark',
                          subTitle: c('Info').t`Password copied`,
                          onClick: close,
                      }
                    : {
                          icon: 'key',
                          title: label,
                          subTitle: (
                              <span className="text-monospace">{getCharsGroupedByColor(generator.password)}</span>
                          ),
                          onClick: () => autofillPassword(copy),
                      })}
            />
            <input ref={inputRef} className="invisible" value={generator.password} readOnly />
            {advanced && (
                <div className="flex-column flex gap-y-2 px-4 pb-3 text-sm ui-red">
                    <hr className="m-0" />
                    <PasswordTypeSelect dense {...generator} />
                    <hr className="m-0" />
                    {isUsingRandomPassword(generator) && <PasswordRandomOptions advanced dense {...generator} />}
                    {isUsingMemorablePassword(generator) && <PasswordMemorableOptions advanced dense {...generator} />}
                    <hr className="m-0" />
                    <div className="flex gap-x-2">
                        <Button className="flex-1" pill shape="solid" onClick={() => autofillPassword(false)}>
                            {label}
                        </Button>
                        <Button icon pill shape="solid" className="shrink-0" onClick={generator.regeneratePassword}>
                            <Icon name="arrows-rotate" alt={c('Action').t`Regenerate`} />
                        </Button>
                    </div>
                </div>
            )}
        </>
    );
};
