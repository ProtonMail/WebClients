import { type FC, useCallback, useEffect, useMemo } from 'react';

import type { DropdownAction } from 'proton-pass-extension/app/content/constants.runtime';
import { useBlurTrap } from 'proton-pass-extension/app/content/services/inline/dropdown/app/components/DropdownFocusController';
import { DropdownHeader } from 'proton-pass-extension/app/content/services/inline/dropdown/app/components/DropdownHeader';
import type { DropdownActions } from 'proton-pass-extension/app/content/services/inline/dropdown/dropdown.app';
import type { InlineMessageWithSender } from 'proton-pass-extension/app/content/services/inline/inline.messages';
import { InlinePortMessageType } from 'proton-pass-extension/app/content/services/inline/inline.messages';
import {
    useIFrameAppController,
    useIFrameAppState,
    useRegisterMessageHandler,
} from 'proton-pass-extension/lib/components/Inline/IFrameApp';
import { ListItem } from 'proton-pass-extension/lib/components/Inline/ListItem';
import { PauseListDropdown } from 'proton-pass-extension/lib/components/Inline/PauseListDropdown';
import { ScrollableItemsList } from 'proton-pass-extension/lib/components/Inline/ScrollableItemsList';
import { contentScriptMessage, sendMessage } from 'proton-pass-extension/lib/message/send-message';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';
import { c } from 'ttag';

import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import Marks from '@proton/components/components/text/Marks';
import { UpsellRef } from '@proton/pass/constants';
import { useMountedState } from '@proton/pass/hooks/useEnsureMounted';
import { useNavigateToUpgrade } from '@proton/pass/hooks/useNavigateToUpgrade';
import { useTelemetryEvent } from '@proton/pass/hooks/useTelemetryEvent';
import { matchChunks } from '@proton/pass/lib/search/match-chunks';
import type { MaybeNull } from '@proton/pass/types';
import { PassIconStatus } from '@proton/pass/types/data/pass-icon';
import { TelemetryEventName } from '@proton/pass/types/data/telemetry';
import type { AutofillLoginResult } from '@proton/pass/types/worker/autofill';
import { partOf, truthy } from '@proton/pass/utils/fp/predicates';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';
import noop from '@proton/utils/noop';

type Props = Extract<DropdownActions, { action: DropdownAction.AUTOFILL_LOGIN }>;

export const AutofillLogin: FC<Props> = ({ origin, startsWith }) => {
    const { settings, visible } = useIFrameAppState();
    const controller = useIFrameAppController();

    const withBlurTrap = useBlurTrap();
    const navigateToUpgrade = useNavigateToUpgrade({ upsellRef: UpsellRef.LIMIT_AUTOFILL });

    const [state, setState] = useMountedState<MaybeNull<AutofillLoginResult>>(null);
    const [filter, setFilterState] = useMountedState<string>(startsWith);
    const loading = useMemo(() => state === null, [state]);

    const resolveCandidates = useCallback(
        () =>
            sendMessage
                .on(
                    contentScriptMessage({
                        type: WorkerMessageType.AUTOFILL_LOGIN_QUERY,
                        payload: {},
                    }),
                    (res) => {
                        if (res.type === 'success') setState(res);
                        else setState({ items: [], needsUpgrade: false });
                    }
                )
                .catch(noop),
        []
    );

    const setFilter = useCallback(
        ({ payload }: InlineMessageWithSender<InlinePortMessageType.AUTOFILL_FILTER>) =>
            setFilterState(payload.startsWith),
        []
    );

    useRegisterMessageHandler(WorkerMessageType.AUTOFILL_SYNC, resolveCandidates);
    useRegisterMessageHandler(InlinePortMessageType.AUTOFILL_FILTER, setFilter);
    useTelemetryEvent(TelemetryEventName.AutofillDisplay, {}, { location: 'source' })([visible]);

    useEffect(() => {
        if (visible) void resolveCandidates();
        else setState(null);
    }, [visible]);

    const dropdownItems = useMemo(
        () =>
            state
                ? [
                      state.needsUpgrade && (
                          <ListItem
                              key="upgrade-autofill"
                              icon={{ type: 'icon', icon: 'arrow-within-square' }}
                              title={c('Info').t`Upgrade ${PASS_APP_NAME}`}
                              subTitle={c('Warning')
                                  .t`Your plan only allows you to autofill from your first two vaults`}
                              onClick={navigateToUpgrade}
                              autogrow
                          />
                      ),
                      ...(filter
                          ? state.items.filter((item) => partOf(item.name, item.userIdentifier)(filter))
                          : state.items
                      ).map(({ shareId, itemId, userIdentifier, name, url }) => {
                          const nameChunks = matchChunks(name, filter);
                          const userChunks = matchChunks(userIdentifier, filter);

                          return (
                              <ListItem
                                  key={itemId}
                                  title={<Marks chunks={nameChunks}>{name}</Marks>}
                                  subTitle={<Marks chunks={userChunks}>{userIdentifier}</Marks>}
                                  icon={{
                                      type: 'icon',
                                      icon: 'user',
                                      url: settings.loadDomainImages ? url : undefined,
                                  }}
                                  onClick={withBlurTrap(() =>
                                      sendMessage.onSuccess(
                                          contentScriptMessage({
                                              type: WorkerMessageType.AUTOFILL_LOGIN,
                                              payload: { shareId, itemId },
                                          }),
                                          ({ userIdentifier, password }) => {
                                              controller.forwardMessage({
                                                  type: InlinePortMessageType.AUTOFILL_LOGIN,
                                                  payload: { userIdentifier, password },
                                              });
                                              controller.close();
                                          }
                                      )
                                  )}
                              />
                          );
                      }),
                  ].filter(truthy)
                : [],
        [state, filter]
    );

    if (loading) return <CircleLoader className="absolute inset-center m-auto" />;

    return (
        <>
            <DropdownHeader
                title={c('Title').t`Log in as...`}
                extra={
                    <PauseListDropdown
                        criteria="Autofill"
                        dense
                        hostname={origin}
                        label={c('Action').t`Do not suggest on this website`}
                    />
                }
            />
            {dropdownItems.length > 0 ? (
                <ScrollableItemsList>{dropdownItems}</ScrollableItemsList>
            ) : (
                <ListItem
                    icon={{ type: 'status', icon: PassIconStatus.ACTIVE }}
                    onClick={controller.close}
                    title={PASS_APP_NAME}
                    subTitle={c('Info').t`No login found`}
                />
            )}
        </>
    );
};
