import { type VFC } from 'react';

import { Button } from '@proton/atoms/Button';
import { Card } from '@proton/atoms/Card';
import Icon from '@proton/components/components/icon/Icon';
import { pageMessage, sendMessage } from '@proton/pass/extension/message';
import { WorkerMessageType } from '@proton/pass/types';

export const Developer: VFC = () => {
    return (
        <Card rounded className="mb-4 p-3 relative">
            <strong className="color-norm block">Extension triggers</strong>
            <hr className="mt-2 mb-4 border-weak" />
            <Button
                icon
                shape="ghost"
                className="w100 flex flex-align-items-center border-norm"
                onClick={() => sendMessage(pageMessage({ type: WorkerMessageType.UPDATE_AVAILABLE }))}
            >
                <Icon name="brand-chrome" className="mr-2" />
                <span className="flex-item-fluid text-left">Trigger update</span>
                <span className="text-xs color-weak">Triggers a fake update (keep popup opened)</span>
            </Button>
        </Card>
    );
};
