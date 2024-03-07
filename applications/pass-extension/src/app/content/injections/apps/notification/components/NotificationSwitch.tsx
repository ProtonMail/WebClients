import type { FC, ReactNode } from 'react';

import type { IFrameCloseOptions, IFrameMessage, NotificationActions } from 'proton-pass-extension/app/content/types';
import { NotificationAction } from 'proton-pass-extension/app/content/types';

import { CircleLoader } from '@proton/atoms/CircleLoader';
import type { ProxiedSettings } from '@proton/pass/store/reducers/settings';
import type { MaybeNull } from '@proton/pass/types';

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

export const NotificationSwitch: FC<Props> = ({ children, visible, state, settings, onMessage, onClose }) => {
    return (
        <div className="h-full p-4 bg-norm relative">
            {children}
            {(() => {
                if (!state) return <CircleLoader className="absolute inset-center m-auto" />;

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
                        return (
                            <AutofillOTP
                                item={state.item}
                                onMessage={onMessage}
                                onClose={onClose}
                                hostname={state.hostname}
                            />
                        );
                    }
                }
            })()}
        </div>
    );
};
