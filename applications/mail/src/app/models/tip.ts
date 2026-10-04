import type { ReactNode } from 'react';

import type { IconComponent } from '@proton/icons/component';

export enum TipActionType {
    CreateFolder = 'folder',
    CreateLabel = 'label',
    DownloadDesktopApp = 'desktop_app',
    GetProtonSubdomainAddress = 'pm.me',
    CreateAlias = 'alias',
    ScheduleMessage = 'schedule_send',
    ClearMailbox = 'auto_delete',
    CreateEmailAddress = 'create_address',
    SnoozeEmail = 'snooze',
    EnableDarkWebMonitoring = 'dwm',
    OpenProtonDrive = 'drive',
    OpenProtonPass = 'pass',
    DownloadProtonVPN = 'vpn',
}

export interface TipData {
    id: number;
    icon: IconComponent;
    message: string;
    cta: ReactNode;
    action: TipActionType;
}
