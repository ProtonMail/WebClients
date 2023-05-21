import { type VFC, useCallback, useEffect, useState } from 'react';

import { c } from 'ttag';

import { CircleLoader } from '@proton/atoms/CircleLoader';
import { pageMessage, sendMessage } from '@proton/pass/extension/message';
import type { AliasState } from '@proton/pass/store';
import { createTelemetryEvent } from '@proton/pass/telemetry/events';
import { type MaybeNull, type RequiredNonNull, WorkerMessageType } from '@proton/pass/types';
import { TelemetryEventName } from '@proton/pass/types/data/telemetry';
import { wait } from '@proton/shared/lib/helpers/promise';

import { AliasPreview } from '../../../../../shared/components/alias/Alias.preview';
import { useEnsureMounted } from '../../../../../shared/hooks/useEnsureMounted';
import { DropdownItem } from '../components/DropdownItem';

const isValidAliasOptions = (
    options: MaybeNull<AliasState['aliasOptions']>
): options is RequiredNonNull<AliasState['aliasOptions']> => {
    return options !== null && options?.suffixes?.[0] !== undefined;
};

const getInitialLoadingText = (): string => c('Info').t`Generating alias...`;

export const AliasAutoSuggest: VFC<{ prefix: string; realm: string; onSubmit: (aliasEmail: string) => void }> = ({
    prefix,
    realm,
    onSubmit,
}) => {
    const ensureMounted = useEnsureMounted();
    const [aliasOptions, setAliasOptions] = useState<MaybeNull<AliasState['aliasOptions']>>(null);
    const [loadingText, setLoadingText] = useState<MaybeNull<string>>(getInitialLoadingText());
    const [error, setError] = useState<boolean>(false);

    const requestAliasOptions = useCallback(async () => {
        try {
            setLoadingText(getInitialLoadingText());
            setError(false);

            await sendMessage.on(pageMessage({ type: WorkerMessageType.ALIAS_OPTIONS }), (response) => {
                if (response.type === 'success') return ensureMounted(setAliasOptions)(response.options);
                throw new Error();
            });
            ensureMounted(setLoadingText)(null);
        } catch (_) {
            ensureMounted(setError)(true);
        }
    }, []);

    const createAlias = useCallback(
        async ({ suffixes, mailboxes }: RequiredNonNull<AliasState['aliasOptions']>) => {
            const defaultSuffix = suffixes[0];

            setLoadingText(c('Info').t`Creating alias...`);
            const aliasEmail = `${prefix}${defaultSuffix.suffix}`;
            try {
                await sendMessage.on(
                    pageMessage({
                        type: WorkerMessageType.ALIAS_CREATE,
                        payload: {
                            realm,
                            alias: {
                                prefix,
                                mailboxes: [mailboxes[0]],
                                signedSuffix: defaultSuffix.signedSuffix,
                                aliasEmail,
                            },
                        },
                    }),
                    (response) => {
                        if (response.type === 'success') {
                            void sendMessage(
                                pageMessage({
                                    type: WorkerMessageType.TELEMETRY_EVENT,
                                    payload: {
                                        event: createTelemetryEvent(TelemetryEventName.AutosuggestAliasCreated, {}, {}),
                                    },
                                })
                            );
                        }

                        if (response.type === 'error') throw new Error(response.error);
                    }
                );

                ensureMounted(() => {
                    setLoadingText(null);
                    onSubmit(aliasEmail);
                })();
            } catch (err) {
                ensureMounted(setError)(true);
            }
        },
        [realm]
    );

    useEffect(() => {
        void wait(500).then(requestAliasOptions);
    }, []);

    useEffect(() => {
        if (error) setLoadingText(null);
    }, [error]);

    const canCreate = isValidAliasOptions(aliasOptions);

    return (
        <DropdownItem
            title={c('Title').t`Create email alias`}
            subTitle={(() => {
                if (loadingText) {
                    return (
                        <span>
                            <CircleLoader className="mr-2" />
                            {loadingText}
                        </span>
                    );
                }

                if (error) {
                    return (
                        <span className="color-danger">
                            {c('Error').t`Cannot create alias.`}{' '}
                            <span className="text-semibold text-underline">{c('Action').t`Try again`}</span>
                        </span>
                    );
                }

                if (canCreate) {
                    return (
                        <AliasPreview
                            prefix={realm}
                            suffix={aliasOptions.suffixes[0].suffix}
                            standalone
                            key="alias-preview"
                        />
                    );
                }
            })()}
            icon="alias"
            disabled={loadingText !== null}
            onClick={(() => {
                if (error) return requestAliasOptions;
                if (canCreate) return () => createAlias(aliasOptions);
            })()}
        />
    );
};
