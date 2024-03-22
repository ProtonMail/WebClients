import { type FC } from 'react';

import { SettingsPanel } from 'proton-pass-extension/lib/components/Settings/SettingsPanel';
import { DropdownDebug } from 'proton-pass-extension/lib/components/Settings/debug/DropdownDebug';
import { NotificationDebug } from 'proton-pass-extension/lib/components/Settings/debug/NotificationDebug';

import { Button } from '@proton/atoms/Button';
import Icon from '@proton/components/components/icon/Icon';
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
        </SettingsPanel>
        <DropdownDebug />
        <NotificationDebug />
    </>
);
