import type { ReactNode, VFC } from 'react';

import { CircleLoader } from '@proton/atoms/CircleLoader';
import type { ProxiedSettings } from '@proton/pass/store/reducers/settings';
import type { MaybeNull } from '@proton/pass/types';

import type { IFrameCloseOptions, IFrameMessage, NotificationActions } from '../../../../types';
import { NotificationAction } from '../../../../types';
import { AutofillOTP } from './AutofillOTP';
import { Autosave } from './Autosave';

type Props = {
    children?: ReactNode;
    settings: ProxiedSettings;
    state: MaybeNull<NotificationActions>;
    visible?: boolean;
    onMessage?: (message: IFrameMessage) => void;
    onClose?: (options?: IFrameCloseOptions) => void;
};

export const NotificationSwitch: VFC<Props> = ({ children, visible, state, settings, onMessage, onClose }) => {
    return (
        <div className="h100 p-5 bg-norm relative">
            {children}
            {(() => {
                if (state === null) return <CircleLoader className="absolute absolute-center m-auto" />;

                switch (state.action) {
                    case NotificationAction.AUTOSAVE_PROMPT: {
                        return (
                            <Autosave
                                submission={state.submission}
                                settings={settings}
                                onClose={onClose}
                                visible={visible}
                            />
                        );
                    }
                    case NotificationAction.AUTOFILL_OTP_PROMPT: {
                        return <AutofillOTP item={state.item} onMessage={onMessage} onClose={onClose} />;
                    }
                }
            })()}
        </div>
    );
};
