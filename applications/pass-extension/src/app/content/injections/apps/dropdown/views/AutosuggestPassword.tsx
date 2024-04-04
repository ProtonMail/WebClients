import { type FC, useEffect, useRef, useState } from 'react';

import { useIFrameContext } from 'proton-pass-extension/app/content/injections/apps/components/IFrameApp';
import { ListItem } from 'proton-pass-extension/app/content/injections/apps/components/ListItem';
import { PauseListDropdown } from 'proton-pass-extension/app/content/injections/apps/components/PauseListDropdown';
import { DropdownHeader } from 'proton-pass-extension/app/content/injections/apps/dropdown/components/DropdownHeader';
import { IFrameMessageType } from 'proton-pass-extension/app/content/types';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Icon } from '@proton/components/index';
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
import type { GeneratePasswordConfig } from '@proton/pass/lib/password/generator';
import { type Maybe } from '@proton/pass/types';
import noop from '@proton/utils/noop';

type Props = { hostname: string; config: GeneratePasswordConfig };

export const AutosuggestPassword: FC<Props> = ({ hostname, config: initial }) => {
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
    const copyPassword = async (immediate: boolean) => {
        inputRef.current?.select();
        document.execCommand('copy');

        forwardMessage({
            type: IFrameMessageType.DROPDOWN_AUTOFILL_GENERATED_PW,
            payload: { password: generator.password },
        });

        timer.current = setTimeout(close, immediate ? 0 : 1_500);
        setCopied(true);
    };

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
                            hostname={hostname}
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
                          title: c('Title').t`Fill & copy password`,
                          subTitle: (
                              <span className="text-monospace">{getCharsGroupedByColor(generator.password)}</span>
                          ),
                          onClick: () => copyPassword(false),
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
                        <Button className="flex-1" pill shape="solid" onClick={() => copyPassword(true)}>
                            {c('Title').t`Fill & copy password`}
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
