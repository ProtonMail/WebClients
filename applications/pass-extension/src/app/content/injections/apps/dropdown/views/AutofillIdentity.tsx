import type { FC } from 'react';
import { useCallback, useEffect, useMemo } from 'react';

import {
    useIFrameAppController,
    useIFrameAppState,
} from 'proton-pass-extension/app/content/injections/apps/components/IFrameApp';
import { ListItem } from 'proton-pass-extension/app/content/injections/apps/components/ListItem';
import { PauseListDropdown } from 'proton-pass-extension/app/content/injections/apps/components/PauseListDropdown';
import { ScrollableItemsList } from 'proton-pass-extension/app/content/injections/apps/components/ScrollableItemsList';
import { DropdownHeader } from 'proton-pass-extension/app/content/injections/apps/dropdown/components/DropdownHeader';
import type { DropdownAction, DropdownActions } from 'proton-pass-extension/app/content/types';
import { IFramePortMessageType } from 'proton-pass-extension/app/content/types';
import { contentScriptMessage, sendMessage } from 'proton-pass-extension/lib/message/send-message';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';
import { c } from 'ttag';

import { CircleLoader } from '@proton/atoms';
import { UpsellRef } from '@proton/pass/constants';
import { useMountedState } from '@proton/pass/hooks/useEnsureMounted';
import { useNavigateToUpgrade } from '@proton/pass/hooks/useNavigateToUpgrade';
import { useTelemetryEvent } from '@proton/pass/hooks/useTelemetryEvent';
import type { MaybeNull } from '@proton/pass/types';
import { PassIconStatus } from '@proton/pass/types/data/pass-icon';
import { TelemetryEventName } from '@proton/pass/types/data/telemetry';
import type { AutofillIdentityResult } from '@proton/pass/types/worker/autofill';
import { truthy } from '@proton/pass/utils/fp/predicates';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';
import noop from '@proton/utils/noop';

type Props = Extract<DropdownActions, { action: DropdownAction.AUTOFILL_IDENTITY }>;

export const AutofillIdentity: FC<Props> = ({ domain }) => {
    const { visible } = useIFrameAppState();
    const controller = useIFrameAppController();
    const [state, setState] = useMountedState<MaybeNull<AutofillIdentityResult>>(null);
    const loading = useMemo(() => state === null, [state]);

    const navigateToUpgrade = useNavigateToUpgrade({ upsellRef: UpsellRef.LIMIT_AUTOFILL });

    const resolveCandidates = useCallback(() => {
        sendMessage
            .on(
                contentScriptMessage({
                    type: WorkerMessageType.AUTOFILL_IDENTITY_QUERY,
                    payload: {},
                }),
                (res) => {
                    if (res.type === 'success') setState(res);
                    else setState({ items: [], needsUpgrade: false });
                }
            )
            .catch(noop);
    }, []);

    useEffect(() => {
        if (visible) resolveCandidates();
        else setState(null);
    }, [visible]);

    useTelemetryEvent(TelemetryEventName.AutofillDisplay, {}, { location: 'source' })([visible]);

    const dropdownItems = useMemo(
        () =>
            state
                ? [
                      state.needsUpgrade && (
                          <ListItem
                              key={'upgrade-autofill'}
                              icon="arrow-within-square"
                              title={c('Info').t`Upgrade ${PASS_APP_NAME}`}
                              subTitle={c('Warning')
                                  .t`Your plan only allows you to autofill from your first two vaults`}
                              onClick={navigateToUpgrade}
                              autogrow
                          />
                      ),
                      ...state.items.map(({ shareId, itemId, name, fullName }) => (
                          <ListItem
                              key={itemId}
                              title={name}
                              subTitle={fullName || c('Title').t`Identity`}
                              icon="card-identity"
                              onClick={() =>
                                  sendMessage.onSuccess(
                                      contentScriptMessage({
                                          type: WorkerMessageType.AUTOFILL_IDENTITY,
                                          payload: { shareId, itemId },
                                      }),
                                      (fields) => {
                                          controller.forwardMessage({
                                              type: IFramePortMessageType.AUTOFILL_IDENTITY,
                                              payload: fields,
                                          });
                                          controller.close({ refocus: false });
                                      }
                                  )
                              }
                          />
                      )),
                  ].filter(truthy)
                : [],
        [state]
    );

    if (loading) return <CircleLoader className="absolute inset-center m-auto" />;

    return (
        <>
            <DropdownHeader
                title={c('Title').t`Autofill`}
                extra={
                    <PauseListDropdown
                        criteria="Autofill"
                        dense
                        hostname={domain}
                        label={c('Action').t`Do not suggest on this website`}
                    />
                }
            />
            {dropdownItems.length > 0 ? (
                <ScrollableItemsList>{dropdownItems}</ScrollableItemsList>
            ) : (
                <ListItem
                    icon={PassIconStatus.ACTIVE}
                    onClick={controller.close}
                    title={PASS_APP_NAME}
                    subTitle={c('Info').t`No identity item found`}
                />
            )}
        </>
    );
};
