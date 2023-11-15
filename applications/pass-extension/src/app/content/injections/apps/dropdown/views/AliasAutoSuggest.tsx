import { type VFC, useCallback, useEffect, useState } from 'react';

import { PauseListDropdown } from 'proton-pass-extension/app/content/injections/apps/common/PauseListDropdown';
import { useIFrameContext } from 'proton-pass-extension/app/content/injections/apps/context/IFrameContextProvider';
import { DropdownHeader } from 'proton-pass-extension/app/content/injections/apps/dropdown/components/DropdownHeader';
import { DropdownItem } from 'proton-pass-extension/app/content/injections/apps/dropdown/components/DropdownItem';
import type { IFrameCloseOptions, IFrameMessage } from 'proton-pass-extension/app/content/types';
import { IFrameMessageType } from 'proton-pass-extension/app/content/types';
import { c } from 'ttag';

import { CircleLoader } from '@proton/atoms/CircleLoader';
import { AliasPreview } from '@proton/pass/components/Alias/legacy/Alias.preview';
import { SubTheme } from '@proton/pass/components/Layout/Theme/types';
import { useEnsureMounted } from '@proton/pass/hooks/useEnsureMounted';
import { useNavigateToUpgrade } from '@proton/pass/hooks/useNavigateToUpgrade';
import { contentScriptMessage, sendMessage } from '@proton/pass/lib/extension/message';
import { createTelemetryEvent } from '@proton/pass/lib/telemetry/event';
import type { AliasOptions, AliasState } from '@proton/pass/store/reducers';
import { type MaybeNull, WorkerMessageType } from '@proton/pass/types';
import { TelemetryEventName } from '@proton/pass/types/data/telemetry';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';
import { wait } from '@proton/shared/lib/helpers/promise';
import noop from '@proton/utils/noop';

type Props = {
    hostname: string;
    prefix: string;
    visible?: boolean;
    onClose?: (options?: IFrameCloseOptions) => void;
    onMessage?: (message: IFrameMessage) => void;
};

const isValidAliasOptions = (options: AliasState['aliasOptions']): options is AliasOptions =>
    options !== null && options?.suffixes?.[0] !== undefined;

const getInitialLoadingText = (): string => c('Info').t`Generating alias...`;

export const AliasAutoSuggest: VFC<Props> = ({ hostname, prefix, visible, onClose, onMessage }) => {
    const ensureMounted = useEnsureMounted();
    const navigateToUpgrade = useNavigateToUpgrade();
    const { userEmail } = useIFrameContext();
    const [aliasOptions, setAliasOptions] = useState<MaybeNull<AliasState['aliasOptions']>>(null);
    const [needsUpgrade, setNeedsUpgrade] = useState<boolean>(false);
    const [loadingText, setLoadingText] = useState<MaybeNull<string>>(getInitialLoadingText());
    const [error, setError] = useState<MaybeNull<string>>(null);

    const requestAliasOptions = useCallback(async () => {
        try {
            setLoadingText(getInitialLoadingText());
            setError(null);
            await wait(500);

            await sendMessage.onSuccess(
                contentScriptMessage({ type: WorkerMessageType.ALIAS_OPTIONS }),
                ensureMounted((response) => {
                    if (response.ok) {
                        setAliasOptions(response.options);
                        setNeedsUpgrade(response.needsUpgrade);
                    } else setError(response.error ?? c('Error').t`Alias options could not be resolved`);
                })
            );
        } catch {
        } finally {
            ensureMounted(setLoadingText)(null);
        }
    }, []);

    const createAlias = useCallback(
        async ({ suffixes, mailboxes }: AliasOptions) => {
            const defaultSuffix = suffixes[0];

            setLoadingText(c('Info').t`Creating alias...`);
            const aliasEmail = `${prefix}${defaultSuffix.suffix}`;
            try {
                await sendMessage.onSuccess(
                    contentScriptMessage({
                        type: WorkerMessageType.ALIAS_CREATE,
                        payload: {
                            url: hostname,
                            alias: {
                                prefix,
                                mailboxes: [mailboxes[0]],
                                signedSuffix: defaultSuffix.signedSuffix,
                                aliasEmail,
                            },
                        },
                    }),
                    ensureMounted((response) => {
                        if (response.ok) {
                            onMessage?.({
                                type: IFrameMessageType.DROPDOWN_AUTOFILL_EMAIL,
                                payload: { email: aliasEmail },
                            });

                            void sendMessage(
                                contentScriptMessage({
                                    type: WorkerMessageType.TELEMETRY_EVENT,
                                    payload: {
                                        event: createTelemetryEvent(TelemetryEventName.AutosuggestAliasCreated, {}, {}),
                                    },
                                })
                            );
                        } else setError(response.error);
                    })
                );
            } catch {
            } finally {
                ensureMounted(setLoadingText)(null);
            }
        },
        [hostname]
    );

    useEffect(() => {
        requestAliasOptions().catch(noop);
    }, []);

    useEffect(() => {
        if (error) setLoadingText(null);
    }, [error]);

    const validAliasOptions = isValidAliasOptions(aliasOptions);

    return (
        <>
            <DropdownHeader
                title={c('Title').t`Email`}
                extra={
                    <PauseListDropdown
                        visible={visible}
                        hostname={hostname}
                        onClose={onClose}
                        criteria="Autosuggest"
                        label={
                            // translation: action to not suggest an email
                            c('Action').t`Do not suggest on this website`
                        }
                    />
                }
            />
            <DropdownItem
                title={c('Title').t`Use my email`}
                disabled={!userEmail}
                subTitle={
                    userEmail ?? (
                        <span className="block flex flex-align-items-center">
                            <CircleLoader className="mr-1" />
                            <span>{c('Info').t`Loading...`}</span>
                        </span>
                    )
                }
                icon="envelope"
                onClick={
                    userEmail
                        ? () =>
                              onMessage?.({
                                  type: IFrameMessageType.DROPDOWN_AUTOFILL_EMAIL,
                                  payload: { email: userEmail },
                              })
                        : noop
                }
            />
            <DropdownItem
                title={needsUpgrade ? c('Info').t`Upgrade ${PASS_APP_NAME}` : c('Title').t`Hide my email`}
                autogrow
                subTitle={(() => {
                    if (loadingText) {
                        return (
                            <span className="block flex flex-align-items-center flex-nowrap">
                                <CircleLoader className="mr-1" />
                                <span className="block text-ellipsis">{loadingText}</span>
                            </span>
                        );
                    }

                    if (needsUpgrade) {
                        return (
                            <span className="text-sm block">{c('Warning')
                                .t`Your plan does not allow you to create more aliases`}</span>
                        );
                    }

                    if (error) {
                        return (
                            <span className="color-danger text-sm block">
                                {c('Error').t`Cannot create alias (${error}).`}{' '}
                                <span className="text-semibold text-underline">{c('Action').t`Try again`}</span>
                            </span>
                        );
                    }

                    if (validAliasOptions) {
                        return (
                            <AliasPreview
                                prefix={prefix}
                                suffix={aliasOptions.suffixes[0].suffix}
                                standalone
                                key="alias-preview"
                            />
                        );
                    }
                })()}
                icon={needsUpgrade ? 'arrow-out-square' : 'alias'}
                subTheme={SubTheme.TEAL}
                disabled={loadingText !== null}
                onClick={(() => {
                    if (needsUpgrade) return navigateToUpgrade;
                    if (error) return requestAliasOptions;
                    if (validAliasOptions) return () => createAlias(aliasOptions);
                })()}
            />
        </>
    );
};
