import { type FC, Fragment, useEffect, useState } from 'react';

import { type Shortcut, resolveShortcuts } from 'proton-pass-extension/lib/extension/commands';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { SettingsPanel } from '@proton/pass/components/Settings/SettingsPanel';
import browser from '@proton/pass/lib/globals/browser';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';
import { isMac } from '@proton/shared/lib/helpers/browser';
import noop from '@proton/utils/noop';

type ShortcutRowProps = {
    description: string;
    shortcut: string;
    onConfigure?: () => void;
};

const ShortcutKeys: FC<{ shortcut: string }> = ({ shortcut }) => (
    <span className="flex items-center gap-1">
        {shortcut.split('+').map((key, i) => (
            <kbd
                key={i}
                className="inline-flex items-center justify-center h-6 px-2 text-sm border border-weak rounded"
                style={{ fontFamily: 'system-ui, sans-serif', minWidth: '1.5rem' }}
            >
                {isMac() && key === 'Ctrl' ? 'Cmd' : key}
            </kbd>
        ))}
    </span>
);

const ShortcutRow: FC<ShortcutRowProps> = ({ description, shortcut, onConfigure }) => (
    <div className="flex flex-nowrap items-center justify-between gap-4">
        <div className="flex-1">
            <span className="block mb-1">
                {shortcut ? (
                    <ShortcutKeys shortcut={shortcut} />
                ) : (
                    <span className="color-weak">{c('Info').t`Not configured`}</span>
                )}
            </span>
            <span className="block color-weak text-sm">{description}</span>
        </div>
        {BUILD_TARGET !== 'firefox' && (
            <Button onClick={onConfigure} size="small" shape="outline">
                {c('Action').t`Configure`}
            </Button>
        )}
    </div>
);

export const Shortcuts: FC = () => {
    const [shortcuts, setShortcuts] = useState<Shortcut[]>([]);

    useEffect(() => {
        browser.commands
            .getAll()
            .then((commands) =>
                setShortcuts(
                    resolveShortcuts(commands, {
                        _execute_action: c('Info').t`Open the ${PASS_APP_NAME} popup`,
                        'open-larger-window': c('Info').t`Open ${PASS_APP_NAME} in a larger window`,
                    })
                )
            )
            .catch(noop);
    }, []);

    const openShortcutsPage =
        BUILD_TARGET !== 'firefox'
            ? () => browser.tabs.create({ url: 'chrome://extensions/shortcuts' }).catch(noop)
            : undefined;

    const subTitle =
        BUILD_TARGET === 'firefox'
            ? c('Info').t`To configure shortcuts, go to about:addons in Firefox and select "Manage Extension Shortcuts"`
            : undefined;

    return (
        <SettingsPanel title={c('Label').t`Keyboard shortcuts`} subTitle={subTitle}>
            <div className="flex flex-column gap-4">
                {shortcuts.map(({ name, description, shortcut }, i) => (
                    <Fragment key={name}>
                        {i > 0 && <hr className="m-0 border-weak" />}
                        <ShortcutRow description={description} shortcut={shortcut} onConfigure={openShortcutsPage} />
                    </Fragment>
                ))}
            </div>
        </SettingsPanel>
    );
};
