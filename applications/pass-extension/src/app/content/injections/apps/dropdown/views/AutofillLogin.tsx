import { type FC, useCallback, useEffect, useMemo } from 'react';

import {
    useIFrameAppController,
    useIFrameAppState,
    useRegisterMessageHandler,
} from 'proton-pass-extension/app/content/injections/apps/components/IFrameApp';
import { ListItem } from 'proton-pass-extension/app/content/injections/apps/components/ListItem';
import { PauseListDropdown } from 'proton-pass-extension/app/content/injections/apps/components/PauseListDropdown';
import { ScrollableItemsList } from 'proton-pass-extension/app/content/injections/apps/components/ScrollableItemsList';
import { DropdownHeader } from 'proton-pass-extension/app/content/injections/apps/dropdown/components/DropdownHeader';
import type { DropdownAction, DropdownActions, IFrameMessageWithSender } from 'proton-pass-extension/app/content/types';
import { IFramePortMessageType } from 'proton-pass-extension/app/content/types';
import { contentScriptMessage, sendMessage } from 'proton-pass-extension/lib/message/send-message';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';
import { c } from 'ttag';

import { CircleLoader } from '@proton/atoms';
import { Marks } from '@proton/components';
import { UpsellRef } from '@proton/pass/constants';
import { useMountedState } from '@proton/pass/hooks/useEnsureMounted';
import { useNavigateToUpgrade } from '@proton/pass/hooks/useNavigateToUpgrade';
import { useTelemetryEvent } from '@proton/pass/hooks/useTelemetryEvent';
import { matchChunks } from '@proton/pass/lib/search/match-chunks';
import type { MaybeNull } from '@proton/pass/types';
import { PassIconStatus } from '@proton/pass/types/data/pass-icon';
import { TelemetryEventName } from '@proton/pass/types/data/telemetry';
import { type AutofillLoginResult } from '@proton/pass/types/worker/autofill';
import { partOf, truthy } from '@proton/pass/utils/fp/predicates';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';
import noop from '@proton/utils/noop';

type Props = Extract<DropdownActions, { action: DropdownAction.AUTOFILL_LOGIN }>;

export const AutofillLogin: FC<Props> = ({ domain, startsWith }) => {
    const { settings, visible } = useIFrameAppState();
    const controller = useIFrameAppController();
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
        ({ payload }: IFrameMessageWithSender<IFramePortMessageType.AUTOFILL_FILTER>) =>
            setFilterState(payload.startsWith),
        []
    );

    useRegisterMessageHandler(WorkerMessageType.AUTOFILL_SYNC, resolveCandidates);
    useRegisterMessageHandler(IFramePortMessageType.AUTOFILL_FILTER, setFilter);
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
                              key={'upgrade-autofill'}
                              icon="arrow-within-square"
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
                                  url={settings.loadDomainImages ? url : undefined}
                                  icon="user"
                                  onClick={() =>
                                      sendMessage.onSuccess(
                                          contentScriptMessage({
                                              type: WorkerMessageType.AUTOFILL_LOGIN,
                                              payload: { shareId, itemId },
                                          }),
                                          ({ userIdentifier, password }) => {
                                              controller.forwardMessage({
                                                  type: IFramePortMessageType.AUTOFILL_LOGIN,
                                                  payload: { userIdentifier, password },
                                              });
                                              controller.close({ refocus: false });
                                          }
                                      )
                                  }
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
                    subTitle={c('Info').t`No login found`}
                />
            )}
        </>
    );
};
