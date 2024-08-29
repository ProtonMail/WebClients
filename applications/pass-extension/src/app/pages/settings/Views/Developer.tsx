import { type FC } from 'react';

import { DropdownDebug } from 'proton-pass-extension/lib/components/Settings/debug/DropdownDebug';
import { NotificationDebug } from 'proton-pass-extension/lib/components/Settings/debug/NotificationDebug';
import { WebsiteRulesDebug } from 'proton-pass-extension/lib/components/Settings/debug/WebsiteRulesDebug';

import { Button } from '@proton/atoms/Button';
import Icon from '@proton/components/components/icon/Icon';
import { SettingsPanel } from '@proton/pass/components/Settings/SettingsPanel';
import { CACHE_KEY } from '@proton/pass/lib/api/cache';
import { pageMessage, sendMessage } from '@proton/pass/lib/extension/message';
import { WorkerMessageType } from '@proton/pass/types';

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
                    <Icon name="brand-chrome" className="mr-2" />
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
                    <Icon name="drive" className="mr-2" />
                    <span className="flex-1 text-left">Trigger full disk</span>
                    <span className="text-xs color-weak">Triggers a fake disk full event (open popup after)</span>
                </div>
            </Button>

            <Button icon shape="ghost" className="w-full" onClick={() => caches.delete(CACHE_KEY)}>
                <div className="flex items-center flex items-center">
                    <Icon name="fire-slash" className="mr-2" />
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
