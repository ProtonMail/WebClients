import { useCallback, useRef, useState } from 'react';

import { Dropdown, DropdownButton, DropdownMenu, DropdownMenuButton, useTheme } from '@proton/components';
import { ThemeModeSetting } from '@proton/shared/lib/themes/constants';
import clsx from '@proton/utils/clsx';

import { getPublicAppThemeSetting } from './getPublicAppThemeSetting';
import { publicThemeModeConfig } from './publicThemeModeConfig';
import { setThemeModeToStorage } from './publicThemeStorage';
import { sendThemeToggleDropdownOpen, sendThemeToggleThemeSelect } from './themeToggleTelemetry';

export const ThemeToggleDropdown = () => {
    const anchorRef = useRef<HTMLButtonElement>(null);
    const [isOpen, setIsOpen] = useState(false);
    const toggle = useCallback(() => {
        setIsOpen((prev) => {
            const newIsOpen = !prev;
            if (newIsOpen) {
                sendThemeToggleDropdownOpen();
            }
            return newIsOpen;
        });
    }, []);
    const close = useCallback(() => setIsOpen(false), []);

    const theme = useTheme();
    const mode = theme.settings.Mode;

    return (
        <>
            <DropdownButton
                ref={anchorRef}
                isOpen={isOpen}
                onClick={toggle}
                icon
                size="small"
                shape="ghost"
                color="norm"
                className="shrink-0"
            >
                {publicThemeModeConfig[mode].icon}
            </DropdownButton>
            <Dropdown isOpen={isOpen} anchorRef={anchorRef} onClose={close}>
                <DropdownMenu>
                    {[ThemeModeSetting.Light, ThemeModeSetting.Dark, ThemeModeSetting.Auto].map(
                        (themeMode: ThemeModeSetting) => {
                            const config = publicThemeModeConfig[themeMode];
                            const isSelected = mode === themeMode;
                            return (
                                <DropdownMenuButton
                                    key={themeMode}
                                    className={clsx('text-left', isSelected && 'text-semibold')}
                                    onClick={() => {
                                        setThemeModeToStorage(themeMode);
                                        sendThemeToggleThemeSelect({ themeMode });
                                        theme.setThemeSetting(getPublicAppThemeSetting({ themeMode }));
                                        close();
                                    }}
                                    aria-pressed={isSelected}
                                >
                                    <span className="flex items-center gap-2">
                                        {config.icon}
                                        <span className="flex flex-nowrap justify-space-between items-baseline gap-2">
                                            <span>{config.label()}</span>
                                            <span className="text-normal color-hint">{config.description?.()}</span>
                                        </span>
                                    </span>
                                </DropdownMenuButton>
                            );
                        }
                    )}
                </DropdownMenu>
            </Dropdown>
        </>
    );
};
