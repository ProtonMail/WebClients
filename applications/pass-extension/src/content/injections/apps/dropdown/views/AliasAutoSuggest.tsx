import { type VFC, useCallback, useEffect, useState } from 'react';

import { c } from 'ttag';

import { CircleLoader } from '@proton/atoms/CircleLoader';
import { pageMessage, sendMessage } from '@proton/pass/extension/message';
import type { AliasState } from '@proton/pass/store';
import { createTelemetryEvent } from '@proton/pass/telemetry/events';
import { type MaybeNull, type RequiredNonNull, WorkerMessageType } from '@proton/pass/types';
import { TelemetryEventName } from '@proton/pass/types/data/telemetry';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';
import { wait } from '@proton/shared/lib/helpers/promise';

import { navigateToUpgrade } from '../../../../..//shared/components/upgrade/UpgradeButton';
import { AliasPreview } from '../../../../../shared/components/alias/Alias.preview';
import { useEnsureMounted } from '../../../../../shared/hooks/useEnsureMounted';
import { DropdownItem } from '../components/DropdownItem';

type Props = {
    prefix: string;
    domain: string;
    onSubmit: (aliasEmail: string) => void;
    onOptions?: () => void;
};

const isValidAliasOptions = (
    options: MaybeNull<AliasState['aliasOptions']>
): options is RequiredNonNull<AliasState['aliasOptions']> => {
    return options !== null && options?.suffixes?.[0] !== undefined;
};

const getInitialLoadingText = (): string => c('Info').t`Generating alias...`;

export const AliasAutoSuggest: VFC<Props> = ({ prefix, domain, onOptions, onSubmit }) => {
    const ensureMounted = useEnsureMounted();
    const [aliasOptions, setAliasOptions] = useState<MaybeNull<AliasState['aliasOptions']>>(null);
    const [needsUpgrade, setNeedsUpgrade] = useState<boolean>(false);
    const [loadingText, setLoadingText] = useState<MaybeNull<string>>(getInitialLoadingText());
    const [error, setError] = useState<boolean>(false);

    const requestAliasOptions = useCallback(async () => {
        try {
            setLoadingText(getInitialLoadingText());
            setError(false);

            await sendMessage.on(pageMessage({ type: WorkerMessageType.ALIAS_OPTIONS }), (response) => {
                if (response.type === 'success' && response.options !== null) {
                    ensureMounted(setAliasOptions)(response.options);
                    ensureMounted(setNeedsUpgrade)(response.needsUpgrade);
                    return onOptions?.(); /* notify parent component if we need an iframe resize */
                }

                throw new Error('alias options could not be resolved');
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
        [domain]
    );

    useEffect(() => {
        void wait(500).then(requestAliasOptions);
    }, []);

    useEffect(() => {
        if (error) setLoadingText(null);
    }, [error]);

    const validAliasOptions = isValidAliasOptions(aliasOptions);

    return (
        <DropdownItem
            title={needsUpgrade ? c('Info').t`Upgrade ${PASS_APP_NAME}` : c('Title').t`Create email alias`}
            autogrow={needsUpgrade}
            subTitle={(() => {
                if (loadingText) {
                    return (
                        <span>
                            <CircleLoader className="mr-2" />
                            {loadingText}
                        </span>
                    );
                }

                if (needsUpgrade) {
                    return <span>{c('Warning').t`Your plan does not allow you to create more aliases`}</span>;
                }

                if (error) {
                    return (
                        <span className="color-danger">
                            {c('Error').t`Cannot create alias.`}{' '}
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
            disabled={loadingText !== null}
            onClick={(() => {
                if (needsUpgrade) return navigateToUpgrade;
                if (error) return requestAliasOptions;
                if (validAliasOptions) return () => createAlias(aliasOptions);
            })()}
        />
    );
};
