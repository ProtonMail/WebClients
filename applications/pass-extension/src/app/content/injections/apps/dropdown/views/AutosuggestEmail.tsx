import { type FC, useCallback, useEffect, useState } from 'react';

import { useIFrameAppController } from 'proton-pass-extension/app/content/injections/apps/components/IFrameApp';
import { ListItem } from 'proton-pass-extension/app/content/injections/apps/components/ListItem';
import { PauseListDropdown } from 'proton-pass-extension/app/content/injections/apps/components/PauseListDropdown';
import { DropdownHeader } from 'proton-pass-extension/app/content/injections/apps/dropdown/components/DropdownHeader';
import {
    type DropdownAction,
    type DropdownActions,
    IFramePortMessageType,
} from 'proton-pass-extension/app/content/types';
import { contentScriptMessage, sendMessage } from 'proton-pass-extension/lib/message/send-message';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';
import { c } from 'ttag';

import { CircleLoader } from '@proton/atoms';
import { AliasPreview } from '@proton/pass/components/Alias/legacy/Alias.preview';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { SubTheme } from '@proton/pass/components/Layout/Theme/types';
import { UpsellRef } from '@proton/pass/constants';
import { useMountedState } from '@proton/pass/hooks/useEnsureMounted';
import { useNavigateToUpgrade } from '@proton/pass/hooks/useNavigateToUpgrade';
import type { AliasState } from '@proton/pass/store/reducers';
import type { AliasOptions, MaybeNull } from '@proton/pass/types';
import { TelemetryEventName } from '@proton/pass/types/data/telemetry';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';
import { wait } from '@proton/shared/lib/helpers/promise';
import noop from '@proton/utils/noop';

type Props = Extract<DropdownActions, { action: DropdownAction.AUTOSUGGEST_ALIAS }>;

const isValidAliasOptions = (options: AliasState['aliasOptions']): options is AliasOptions =>
    options !== null && options?.suffixes?.[0] !== undefined;

const getInitialLoadingText = (): string => c('Info').t`Generating alias...`;

export const AutosuggestEmail: FC<Props> = ({ domain, prefix }) => {
    const controller = useIFrameAppController();
    const { onTelemetry } = usePassCore();
    const navigateToUpgrade = useNavigateToUpgrade({ upsellRef: UpsellRef.LIMIT_ALIAS });

    const [userEmail, setUserEmail] = useState<MaybeNull<string>>(null);
    const [aliasOptions, setAliasOptions] = useMountedState<MaybeNull<AliasState['aliasOptions']>>(null);
    const [needsUpgrade, setNeedsUpgrade] = useMountedState<boolean>(false);
    const [loadingText, setLoadingText] = useMountedState<MaybeNull<string>>(getInitialLoadingText());
    const [error, setError] = useMountedState<MaybeNull<string>>(null);

    const requestAliasOptions = useCallback(async () => {
        try {
            setLoadingText(getInitialLoadingText());
            setError(null);
            await wait(500);

            await sendMessage.on(contentScriptMessage({ type: WorkerMessageType.ALIAS_OPTIONS }), (response) => {
                if (response.type === 'success' && response.ok) {
                    setAliasOptions(response.options);
                    setNeedsUpgrade(response.needsUpgrade);
                } else setError(response.error ?? c('Error').t`Alias options could not be resolved`);
            });
        } catch {
        } finally {
            setLoadingText(null);
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
                            url: domain,
                            alias: {
                                prefix,
                                mailboxes: [mailboxes[0]],
                                signedSuffix: defaultSuffix.signedSuffix,
                                aliasEmail,
                            },
                        },
                    }),
                    (response) => {
                        if (response.ok) {
                            controller.forwardMessage({
                                type: IFramePortMessageType.AUTOFILL_EMAIL,
                                payload: { email: aliasEmail },
                            });

                            onTelemetry(TelemetryEventName.AutosuggestAliasCreated, {}, {});

                            controller.close({ refocus: false });
                        } else setError(response.error ?? null);
                    }
                );
            } catch {
            } finally {
                setLoadingText(null);
            }
        },
        [domain]
    );

    useEffect(() => {
        sendMessage
            .onSuccess(
                contentScriptMessage({ type: WorkerMessageType.RESOLVE_USER }),
                (response) => response.user?.Email && setUserEmail(response.user.Email)
            )
            .catch(noop);

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
                        criteria="Autosuggest"
                        dense
                        hostname={domain}
                        label={c('Action').t`Do not suggest on this website`}
                    />
                }
            />
            {userEmail && (
                <ListItem
                    title={c('Title').t`Use my email`}
                    disabled={!userEmail}
                    subTitle={
                        userEmail ?? (
                            <span className="block flex items-center">
                                <CircleLoader className="mr-1" />
                                <span>{c('Info').t`Loading...`}</span>
                            </span>
                        )
                    }
                    icon="envelope"
                    onClick={() => {
                        controller.forwardMessage({
                            type: IFramePortMessageType.AUTOFILL_EMAIL,
                            payload: { email: userEmail },
                        });
                        controller.close();
                    }}
                />
            )}
            <ListItem
                title={
                    needsUpgrade
                        ? c('Info').t`Upgrade ${PASS_APP_NAME}`
                        : // translator: action of hiding my email, in contrast with the previous label "Use my email"
                          c('Title').t`Hide my email`
                }
                autogrow
                subTitle={(() => {
                    if (loadingText) {
                        return (
                            <span className="block flex items-center flex-nowrap">
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
                icon={needsUpgrade ? 'arrow-within-square' : 'alias'}
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
