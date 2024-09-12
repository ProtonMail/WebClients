import type { ReactNode } from 'react';

import type { IconName } from '@proton/components';

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
    icon: IconName;
    message: string;
    cta: ReactNode;
    action: TipActionType;
}
