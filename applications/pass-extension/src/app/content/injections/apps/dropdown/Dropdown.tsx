import { type FC, useCallback, useEffect, useState } from 'react';

import { DROPDOWN_MIN_HEIGHT } from 'proton-pass-extension/app/content/constants.static';
import {
    useIFrameAppController,
    useIFrameAppState,
    useRegisterMessageHandler,
} from 'proton-pass-extension/app/content/injections/apps/components/IFrameApp';
import { IFrameAppAutoSizer } from 'proton-pass-extension/app/content/injections/apps/components/IFrameAppAutoSizer';
import { ListItem } from 'proton-pass-extension/app/content/injections/apps/components/ListItem';
import { ListItemIcon } from 'proton-pass-extension/app/content/injections/apps/components/ListItemIcon';
import { PinUnlock } from 'proton-pass-extension/app/content/injections/apps/components/PinUnlock';
import { DropdownAction, type DropdownActions, IFramePortMessageType } from 'proton-pass-extension/app/content/types';
import { useRequestFork } from 'proton-pass-extension/lib/hooks/useRequestFork';
import { contentScriptMessage, sendMessage } from 'proton-pass-extension/lib/message/send-message';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';
import { c } from 'ttag';

import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import { useAppState } from '@proton/pass/components/Core/AppStateProvider';
import { Localized } from '@proton/pass/components/Core/Localized';
import { clientBusy, clientErrored, clientMissingScope, clientSessionLocked } from '@proton/pass/lib/client';
import type { MaybeNull } from '@proton/pass/types';
import { PassIconStatus } from '@proton/pass/types/data/pass-icon';
import { ForkType } from '@proton/shared/lib/authentication/fork/constants';
import { BRAND_NAME, PASS_APP_NAME, PASS_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';

import { AutofillIdentity } from './views/AutofillIdentity';
import { AutofillLogin } from './views/AutofillLogin';
import { AutosuggestEmail } from './views/AutosuggestEmail';
import { AutosuggestPassword } from './views/AutosuggestPassword';

import './Dropdown.scss';

type Props = {
    /** @internal Only used for debugging component */
    initial?: DropdownActions;
};

export const Dropdown: FC<Props> = ({ initial = null }) => {
    const { visible } = useIFrameAppState();
    const controller = useIFrameAppController();
    const { status, authorized, lockSetup } = useAppState();
    const accountFork = useRequestFork();

    const [state, setState] = useState<MaybeNull<DropdownActions>>(initial);
    const loading = state === null || clientBusy(status);

    useRegisterMessageHandler(
        IFramePortMessageType.DROPDOWN_ACTION,
        useCallback(({ payload }) => setState(payload), [])
    );

    useEffect(() => setState((prev) => (visible ? prev : null)), [visible]);

    return (
        <IFrameAppAutoSizer
            className="min-h-custom bg-norm relative"
            style={{ '--min-h-custom': `${DROPDOWN_MIN_HEIGHT}px` }}
        >
            <Localized>
                {(() => {
                    if (loading) return <CircleLoader className="absolute inset-center m-auto" />;

                    if (clientSessionLocked(status)) {
                        return (
                            <PinUnlock
                                header={
                                    <div className="flex items-center gap-3 mb-3">
                                        <ListItemIcon icon={PassIconStatus.LOCKED_DROPDOWN} />
                                        <div className="flex-1">
                                            <span className="block text-ellipsis">{c('Label')
                                                .t`Unlock ${PASS_APP_NAME}`}</span>
                                            <span className={clsx('block color-weak text-sm text-ellipsis')}>{c('Info')
                                                .t`Enter your PIN code`}</span>
                                        </div>
                                    </div>
                                }
                                onUnlock={() => controller.close({ refocus: true })}
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

                    if (clientMissingScope(status)) {
                        return (
                            <ListItem
                                onClick={controller.close}
                                subTitle={c('Info')
                                    .t`Please enter your extra password to start using ${PASS_SHORT_APP_NAME}.`}
                                icon={PassIconStatus.LOCKED}
                                autogrow
                            />
                        );
                    }

                    if (!authorized) {
                        return (
                            <ListItem
                                onClick={() => {
                                    if (!lockSetup) return accountFork({ forkType: ForkType.SWITCH });
                                    controller.close();
                                }}
                                subTitle={
                                    lockSetup
                                        ? c('Info')
                                              .t`Your organization requires you to secure your access to ${PASS_APP_NAME}`
                                        : c('Info').t`Enable ${PASS_APP_NAME} by connecting your ${BRAND_NAME} account`
                                }
                                icon={PassIconStatus.DISABLED}
                                autogrow
                            />
                        );
                    }

                    switch (state.action) {
                        case DropdownAction.AUTOFILL_IDENTITY:
                            return <AutofillIdentity {...state} />;
                        case DropdownAction.AUTOFILL_LOGIN:
                            return <AutofillLogin {...state} />;
                        case DropdownAction.AUTOSUGGEST_PASSWORD:
                            return <AutosuggestPassword {...state} />;
                        case DropdownAction.AUTOSUGGEST_ALIAS:
                            return <AutosuggestEmail {...state} />;
                    }
                })()}
            </Localized>
        </IFrameAppAutoSizer>
    );
};
