import { type FC, useEffect, useRef, useState } from 'react';

import {
    useIFrameContext,
    useRegisterMessageHandler,
} from 'proton-pass-extension/app/content/injections/apps/components/IFrameApp';
import { LIST_ITEM_HEIGHT, ListItem } from 'proton-pass-extension/app/content/injections/apps/components/ListItem';
import { ListItemIcon } from 'proton-pass-extension/app/content/injections/apps/components/ListItemIcon';
import { PinUnlock } from 'proton-pass-extension/app/content/injections/apps/components/PinUnlock';
import { DropdownAction, type DropdownActions, IFrameMessageType } from 'proton-pass-extension/app/content/types';
import { useRequestFork } from 'proton-pass-extension/lib/hooks/useRequestFork';
import { c } from 'ttag';

import { CircleLoader } from '@proton/atoms/CircleLoader';
import { Localized } from '@proton/pass/components/Core/Localized';
import { clientBusy, clientErrored, clientLocked, clientUnauthorized } from '@proton/pass/lib/client';
import { contentScriptMessage, sendMessage } from '@proton/pass/lib/extension/message';
import type { MaybeNull } from '@proton/pass/types';
import { WorkerMessageType } from '@proton/pass/types';
import { PassIconStatus } from '@proton/pass/types/data/pass-icon';
import { FORK_TYPE } from '@proton/shared/lib/authentication/ForkInterface';
import { BRAND_NAME, PASS_APP_NAME } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';

import { AutofillLogin } from './views/AutofillLogin';
import { AutosuggestEmail } from './views/AutosuggestEmail';
import { AutosuggestPassword } from './views/AutosuggestPassword';

import './Dropdown.scss';

export const Dropdown: FC = () => {
    const { visible, resize, appState, close } = useIFrameContext();
    const { status } = appState;

    const [state, setState] = useState<MaybeNull<DropdownActions>>(null);
    const ref = useRef<HTMLDivElement>(null);

    const accountFork = useRequestFork();
    const loading = state === null || clientBusy(status);

    useRegisterMessageHandler(IFrameMessageType.DROPDOWN_ACTION, ({ payload }) => setState(payload));

    useEffect(() => {
        if (ref.current) {
            const obs = new ResizeObserver(([entry]) => resize(entry.contentRect.height));
            obs.observe(ref.current);
            return () => obs.disconnect();
        }
    });

    useEffect(() => {
        if (!visible) setState(null);
    }, [visible]);

    return (
        <Localized>
            <div
                ref={ref}
                className="min-h-custom bg-norm relative"
                style={{ '--min-h-custom': `${LIST_ITEM_HEIGHT}rem` }}
            >
                {(() => {
                    if (loading) return <CircleLoader className="absolute inset-center m-auto" />;

                    if (clientLocked(status)) {
                        return (
                            <PinUnlock
                                header={
                                    <div className="flex items-center gap-3 mb-3">
                                        <ListItemIcon icon={PassIconStatus.LOCKED_DROPDOWN} />
                                        <div className="flex-1">
                                            <span className="block text-ellipsis">{c('Title')
                                                .t`Unlock ${PASS_APP_NAME}`}</span>
                                            <span className={clsx('block color-weak text-sm text-ellipsis')}>{c('Info')
                                                .t`Enter your PIN code`}</span>
                                        </div>
                                    </div>
                                }
                                onUnlock={() => close({ refocus: true })}
                            />
                        );
                    }

                    if (clientErrored(status)) {
                        return (
                            <ListItem
                                onClick={() =>
                                    sendMessage(
                                        contentScriptMessage({
                                            type: WorkerMessageType.AUTH_INIT,
                                            options: {
                                                retryable: false,
                                                forceLock: true,
                                            },
                                        })
                                    )
                                }
                                title={c('Action').t`Sign back in`}
                                subTitle={
                                    <span className="color-danger">{c('Warning')
                                        .t`Your session could not be resumed.`}</span>
                                }
                                icon={PassIconStatus.DISABLED}
                                autogrow
                            />
                        );
                    }

                    if (clientUnauthorized(status)) {
                        return (
                            <ListItem
                                onClick={async () => {
                                    close();
                                    await accountFork(FORK_TYPE.SWITCH);
                                }}
                                subTitle={c('Info').t`Enable ${PASS_APP_NAME} by connecting your ${BRAND_NAME} account`}
                                icon={PassIconStatus.DISABLED}
                                autogrow
                            />
                        );
                    }

                    switch (state.action) {
                        case DropdownAction.AUTOFILL:
                            return <AutofillLogin {...state} />;
                        case DropdownAction.AUTOSUGGEST_PASSWORD:
                            return <AutosuggestPassword {...state} />;
                        case DropdownAction.AUTOSUGGEST_ALIAS:
                            return <AutosuggestEmail {...state} />;
                    }
                })()}
            </div>
        </Localized>
    );
};
