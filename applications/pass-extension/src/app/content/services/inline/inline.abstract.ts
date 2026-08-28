import type { PassThemeOption } from '@proton/pass/components/Layout/Theme/types';

import type { DropdownHandler } from './dropdown/dropdown.abstract';
import type { IconRegistry } from './icon/icon.registry';
import type { NotificationHandler } from './notification/notification.abstract';

export interface AbstractInlineService {
    init: () => void;
    sync: () => void;
    destroy: () => void;
    setTheme: (theme?: PassThemeOption) => void;

    dropdown: DropdownHandler;
    notification: NotificationHandler;
    icon: IconRegistry;
}
