import type { ReactNode } from 'react';

import type { IconName } from '@proton/components/components';

export enum TipActionType {
    CreateFolder,
    CreateLabel,
    DownloadDesktopApp,
    GetProtonSubdomainAddress,
    CreateAlias,
    ScheduleMessage,
    ClearMailbox,
    CreateEmailAddress,
    SnoozeEmail,
    EnableDarkWebMonitoring,
    OpenProtonPass,
    OpenProtonDrive,
    DownloadProtonVPN,
}

export interface TipData {
    id: number;
    icon: IconName;
    message: string;
    cta: ReactNode;
    action: TipActionType;
}
