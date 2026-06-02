import type { FC } from 'react';

import { DropdownDebug } from 'proton-pass-extension/lib/components/Settings/debug/DropdownDebug';
import { NotificationDebug } from 'proton-pass-extension/lib/components/Settings/debug/NotificationDebug';
import { WebsiteRulesDebug } from 'proton-pass-extension/lib/components/Settings/debug/WebsiteRulesDebug';
import { pageMessage, sendMessage } from 'proton-pass-extension/lib/message/send-message';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';

import { Button } from '@proton/atoms/Button/Button';
import { IcBrandChrome } from '@proton/icons/icons/IcBrandChrome';
import { IcDrive } from '@proton/icons/icons/IcDrive';
import { IcFireSlash } from '@proton/icons/icons/IcFireSlash';
import { SettingsPanel } from '@proton/pass/components/Settings/SettingsPanel';
import { CACHE_KEY } from '@proton/pass/lib/api/cache';

export const Developer: FC = () => (
    <>
        <SettingsPanel title="Extension triggers">
            <Button
                icon
                shape="ghost"
                className="w-full"
                onClick={() =>
                    sendMessage(
                        pageMessage({
                            type: WorkerMessageType.DEBUG,
                            payload: { debug: 'update_trigger' },
                        })
                    )
                }
            >
                <div className="flex items-center flex items-center">
                    <IcBrandChrome className="mr-2" />
                    <span className="flex-1 text-left">Trigger update</span>
                    <span className="text-xs color-weak">Triggers a fake update (keep popup opened)</span>
                </div>
            </Button>
            <Button
                icon
                shape="ghost"
                className="w-full"
                onClick={() =>
                    sendMessage(
                        pageMessage({
                            type: WorkerMessageType.DEBUG,
                            payload: { debug: 'storage_full' },
                        })
                    )
                }
            >
                <div className="flex items-center flex items-center">
                    <IcDrive className="mr-2" />
                    <span className="flex-1 text-left">Trigger full disk</span>
                    <span className="text-xs color-weak">Triggers a fake disk full event (open popup after)</span>
                </div>
            </Button>

            <Button icon shape="ghost" className="w-full" onClick={() => caches.delete(CACHE_KEY)}>
                <div className="flex items-center flex items-center">
                    <IcFireSlash className="mr-2" />
                    <span className="flex-1 text-left">Clear network cache</span>
                    <span className="text-xs color-weak">Removes all API network cached entries</span>
                </div>
            </Button>
        </SettingsPanel>
        <WebsiteRulesDebug />
        <DropdownDebug />
        <NotificationDebug />
    </>
);
