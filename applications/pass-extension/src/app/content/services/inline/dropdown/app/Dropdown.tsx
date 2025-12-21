import { type FC, useCallback, useEffect, useState } from 'react';

import { DropdownAction } from 'proton-pass-extension/app/content/constants.runtime';
import { DROPDOWN_MIN_HEIGHT } from 'proton-pass-extension/app/content/constants.static';
import type { DropdownActions } from 'proton-pass-extension/app/content/services/inline/dropdown/dropdown.app';
import { InlinePortMessageType } from 'proton-pass-extension/app/content/services/inline/inline.messages';
import {
    useIFrameAppController,
    useIFrameAppState,
    useRegisterMessageHandler,
} from 'proton-pass-extension/lib/components/Inline/IFrameApp';
import { IFrameAppAutoSizer } from 'proton-pass-extension/lib/components/Inline/IFrameAppAutoSizer';
import { ListItem } from 'proton-pass-extension/lib/components/Inline/ListItem';
import { useRequestFork } from 'proton-pass-extension/lib/hooks/useRequestFork';
import { contentScriptMessage, sendMessage } from 'proton-pass-extension/lib/message/send-message';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';
import { c } from 'ttag';

import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import { useAppState } from '@proton/pass/components/Core/AppStateProvider';
import { Localized } from '@proton/pass/components/Core/Localized';
import { clientBusy, clientErrored, clientMissingScope, clientSessionLocked } from '@proton/pass/lib/client';
import { PassIconStatus } from '@proton/pass/types/data/pass-icon';
import type { MaybeNull } from '@proton/pass/types/utils/index';
import { ForkType } from '@proton/shared/lib/authentication/fork/constants';
import { BRAND_NAME, PASS_APP_NAME, PASS_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import { DropdownFocusController } from './components/DropdownFocusController';
import { DropdownUnlock } from './components/DropdownUnlock';
import { AutofillCC } from './views/AutofillCC';
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
        InlinePortMessageType.DROPDOWN_ACTION,
        useCallback(({ payload }) => setState(payload), [])
    );

    useEffect(() => setState((prev) => (visible ? prev : null)), [visible]);

    return (
        <IFrameAppAutoSizer
            className="min-h-custom bg-norm relative"
            style={{ '--min-h-custom': `${DROPDOWN_MIN_HEIGHT}px` }}
        >
            <DropdownFocusController>
                <Localized>
                    {(() => {
                        if (loading) return <CircleLoader className="absolute inset-center m-auto" />;

                        if (clientSessionLocked(status)) return <DropdownUnlock />;

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
                                    icon={{ type: 'status', icon: PassIconStatus.DISABLED }}
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
                                    icon={{ type: 'status', icon: PassIconStatus.LOCKED }}
                                    autogrow
                                />
                            );
                        }

                        if (!authorized) {
                            return (
                                <ListItem
                                    onClick={() => {
                                        if (!lockSetup) return accountFork({ forkType: ForkType.SWITCH });
                                        controller.close({ userAction: true });
                                    }}
                                    subTitle={
                                        lockSetup
                                            ? c('Info')
                                                  .t`Your organization requires you to secure your access to ${PASS_APP_NAME}`
                                            : c('Info')
                                                  .t`Enable ${PASS_APP_NAME} by connecting your ${BRAND_NAME} account`
                                    }
                                    icon={{ type: 'status', icon: PassIconStatus.DISABLED }}
                                    autogrow
                                />
                            );
                        }

                        switch (state.action) {
                            case DropdownAction.AUTOFILL_CC:
                                return <AutofillCC {...state} />;
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
            </DropdownFocusController>
        </IFrameAppAutoSizer>
    );
};
