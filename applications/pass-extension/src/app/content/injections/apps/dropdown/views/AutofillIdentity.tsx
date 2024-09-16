import type { FC } from 'react';
import { useCallback, useEffect, useMemo } from 'react';

import { useIFrameContext } from 'proton-pass-extension/app/content/injections/apps/components/IFrameApp';
import { ListItem } from 'proton-pass-extension/app/content/injections/apps/components/ListItem';
import { PauseListDropdown } from 'proton-pass-extension/app/content/injections/apps/components/PauseListDropdown';
import { DropdownHeader } from 'proton-pass-extension/app/content/injections/apps/dropdown/components/DropdownHeader';
import { DropdownItemsList } from 'proton-pass-extension/app/content/injections/apps/dropdown/components/DropdownItemsList';
import type { DropdownAction, DropdownActions } from 'proton-pass-extension/app/content/types';
import { IFramePortMessageType } from 'proton-pass-extension/app/content/types';
import { c } from 'ttag';

import { CircleLoader } from '@proton/atoms';
import { UpsellRef } from '@proton/pass/constants';
import { useMountedState } from '@proton/pass/hooks/useEnsureMounted';
import { useNavigateToUpgrade } from '@proton/pass/hooks/useNavigateToUpgrade';
import { useTelemetryEvent } from '@proton/pass/hooks/useTelemetryEvent';
import { contentScriptMessage, sendMessage } from '@proton/pass/lib/extension/message/send-message';
import type { MaybeNull } from '@proton/pass/types';
import { WorkerMessageType } from '@proton/pass/types';
import { PassIconStatus } from '@proton/pass/types/data/pass-icon';
import { TelemetryEventName } from '@proton/pass/types/data/telemetry';
import type { AutofillIdentityResult } from '@proton/pass/types/worker/autofill';
import { truthy } from '@proton/pass/utils/fp/predicates';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';
import noop from '@proton/utils/noop';

type Props = Extract<DropdownActions, { action: DropdownAction.AUTOFILL_IDENTITY }>;

export const AutofillIdentity: FC<Props> = ({ domain }) => {
    const { visible, close, forwardMessage } = useIFrameContext();
    const [state, setState] = useMountedState<MaybeNull<AutofillIdentityResult>>(null);
    const loading = state === null;

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
                              icon="arrow-out-square"
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
                                          forwardMessage({
                                              type: IFramePortMessageType.DROPDOWN_AUTOFILL_IDENTITY,
                                              payload: fields,
                                          });
                                          close({ refocus: false });
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
                <DropdownItemsList>{dropdownItems}</DropdownItemsList>
            ) : (
                <ListItem
                    icon={PassIconStatus.ACTIVE}
                    onClick={close}
                    title={PASS_APP_NAME}
                    subTitle={c('Info').t`No identity item found`}
                />
            )}
        </>
    );
};
