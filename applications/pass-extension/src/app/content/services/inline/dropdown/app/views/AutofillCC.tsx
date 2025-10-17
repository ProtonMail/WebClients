import type { FC } from 'react';
import { useCallback, useEffect, useMemo } from 'react';

import type { DropdownAction } from 'proton-pass-extension/app/content/constants.runtime';
import { DropdownHeader } from 'proton-pass-extension/app/content/services/inline/dropdown/app/components/DropdownHeader';
import type { DropdownActions } from 'proton-pass-extension/app/content/services/inline/dropdown/dropdown.app';
import { InlinePortMessageType } from 'proton-pass-extension/app/content/services/inline/inline.messages';
import { useIFrameAppController, useIFrameAppState } from 'proton-pass-extension/lib/components/Inline/IFrameApp';
import { useBlurTrap } from 'proton-pass-extension/lib/components/Inline/IFrameFocusController';
import { ListItem } from 'proton-pass-extension/lib/components/Inline/ListItem';
import { PauseListDropdown } from 'proton-pass-extension/lib/components/Inline/PauseListDropdown';
import { ScrollableItemsList } from 'proton-pass-extension/lib/components/Inline/ScrollableItemsList';
import { contentScriptMessage, sendMessage } from 'proton-pass-extension/lib/message/send-message';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';
import { c } from 'ttag';

import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import { getCreditCardIcon } from '@proton/pass/components/Layout/Icon/ItemIcon';
import { SubTheme } from '@proton/pass/components/Layout/Theme/types';
import { UpsellRef } from '@proton/pass/constants';
import { useMountedState } from '@proton/pass/hooks/useEnsureMounted';
import { useNavigateToUpgrade } from '@proton/pass/hooks/useNavigateToUpgrade';
import { useTelemetryEvent } from '@proton/pass/hooks/useTelemetryEvent';
import type { MaybeNull } from '@proton/pass/types';
import { PassIconStatus } from '@proton/pass/types/data/pass-icon';
import { TelemetryEventName } from '@proton/pass/types/data/telemetry';
import type { AutofillCCResult } from '@proton/pass/types/worker/autofill';
import { truthy } from '@proton/pass/utils/fp/predicates';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';
import noop from '@proton/utils/noop';

type Props = Extract<DropdownActions, { action: DropdownAction.AUTOFILL_CC }>;

export const AutofillCC: FC<Props> = ({ origin, frameId }) => {
    const { visible } = useIFrameAppState();
    const controller = useIFrameAppController();
    const [state, setState] = useMountedState<MaybeNull<AutofillCCResult>>(null);
    const loading = useMemo(() => state === null, [state]);

    const withBlurTrap = useBlurTrap();
    const navigateToUpgrade = useNavigateToUpgrade({ upsellRef: UpsellRef.LIMIT_AUTOFILL });

    const resolveCandidates = useCallback(() => {
        sendMessage
            .on(
                contentScriptMessage({
                    type: WorkerMessageType.AUTOFILL_CC_QUERY,
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
                              icon={{ type: 'icon', icon: 'arrow-out-square' }}
                              title={c('Info').t`Upgrade ${PASS_APP_NAME}`}
                              subTitle={c('Warning').t`Your plan does not allow you to autofill credit-card items.`}
                              onClick={navigateToUpgrade}
                              autogrow
                          />
                      ),
                      ...(!state.needsUpgrade
                          ? state.items.map(({ shareId, itemId, name, obfuscatedNumber, expirationDate, cardType }) => (
                                <ListItem
                                    key={itemId}
                                    title={
                                        <div className="flex flex-nowrap gap-2 items-center">
                                            <span className="text-ellipsis">{name}</span>
                                            <span className="shrink-0 color-weak text-sm">
                                                {obfuscatedNumber
                                                    .replaceAll('*', '•')
                                                    .slice(obfuscatedNumber.length - 8)}
                                            </span>
                                        </div>
                                    }
                                    subTitle={expirationDate.split('-').reverse().join('/')}
                                    icon={{
                                        type: 'icon',
                                        icon: 'credit-card',
                                        customIcon: getCreditCardIcon(cardType),
                                    }}
                                    onClick={withBlurTrap(() =>
                                        controller.forwardMessage({
                                            type: InlinePortMessageType.AUTOFILL_ACTION,
                                            payload: { shareId, itemId, origin, frameId, type: 'creditCard' },
                                        })
                                    )}
                                    subTheme={SubTheme.LIME}
                                />
                            ))
                          : []),
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
                    subTitle={c('Info').t`No credit cards found`}
                />
            )}
        </>
    );
};
