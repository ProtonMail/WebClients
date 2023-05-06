import { type VFC, useCallback, useEffect, useMemo, useState } from 'react';

import { c } from 'ttag';

import { CircleLoader } from '@proton/atoms/CircleLoader';
import { pageMessage, sendMessage } from '@proton/pass/extension/message';
import type { AliasState } from '@proton/pass/store';
import { createTelemetryEvent } from '@proton/pass/telemetry/events';
import { AliasCreationDTO, type MaybeNull, type RequiredNonNull, WorkerMessageType } from '@proton/pass/types';
import { TelemetryEventName } from '@proton/pass/types/data/telemetry';
import { logger } from '@proton/pass/utils/logger';
import { wait } from '@proton/shared/lib/helpers/promise';
import noop from '@proton/utils/noop';

import { AliasPreview } from '../../../../../shared/components/alias/Alias.preview';
import { deriveAliasPrefixFromName } from '../../../../../shared/items/alias';
import { useIFrameContext } from '../../context/IFrameContextProvider';
import { DropdownItem } from '../components/DropdownItem';

const isValidAliasOptions = (
    options: MaybeNull<AliasState['aliasOptions']>
): options is RequiredNonNull<AliasState['aliasOptions']> => {
    return options !== null && options?.suffixes?.[0] !== undefined;
};

export const AliasAutoSuggest: VFC<{ realm: string; onSubmit: (aliasEmail: string) => void }> = ({
    realm,
    onSubmit,
}) => {
    const { endpoint } = useIFrameContext();
    const [aliasOptions, setAliasOptions] = useState<MaybeNull<AliasState['aliasOptions']>>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [, setErrorMessage] = useState<string>();
    const prefix = useMemo(() => deriveAliasPrefixFromName(realm), [realm]);

    useEffect(() => {
        void wait(500).then(() =>
            sendMessage.on(pageMessage({ type: WorkerMessageType.ALIAS_OPTIONS }), (response) => {
                if (response.type === 'success') setAliasOptions(response.options);
                setLoading(false);
            })
        );
    }, []);

    const createAlias = useCallback(
        async (alias: AliasCreationDTO) => {
            await sendMessage.on(
                pageMessage({
                    type: WorkerMessageType.ALIAS_CREATE,
                    payload: { realm, alias },
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
        },
        [realm]
    );

    const { disabled, subTitle, onClick } = useMemo(() => {
        if (isValidAliasOptions(aliasOptions)) {
            const defaultSuffix = aliasOptions.suffixes[0];

            return {
                disabled: false,
                subTitle: <AliasPreview prefix={realm} suffix={defaultSuffix.suffix} standalone key="alias-preview" />,
                onClick: async () => {
                    setLoading(true);
                    const aliasEmail = `${prefix}${defaultSuffix.suffix}`;
                    try {
                        await createAlias({
                            prefix,
                            mailboxes: [aliasOptions.mailboxes[0]],
                            signedSuffix: defaultSuffix.signedSuffix,
                            aliasEmail,
                        });

                        setLoading(false);
                        onSubmit(aliasEmail);
                    } catch (err) {
                        setLoading(false);
                        if (err instanceof Error) {
                            const errorMessage = err.message;
                            logger.error(`[IFrame::${endpoint}] Alias creation failed. ${errorMessage}`);
                            setErrorMessage(
                                c('Error').t`Could not create alias email at the moment, please try again later`
                            );
                        }
                    }
                },
            };
        }

        return {
            onClick: noop,
            disabled: true,
            subTitle: loading ? (
                <CircleLoader key="loader" style={{ transform: 'translate3d(0,0,0)' }} />
            ) : (
                <span className="color-danger">{c('Warning').t`Cannot create alias`}</span>
            ),
        };
    }, [aliasOptions, loading, prefix, createAlias]);

    return (
        <DropdownItem
            title={c('Title').t`Create email alias`}
            subTitle={subTitle}
            icon="alias"
            disabled={disabled}
            onClick={onClick}
        />
    );
};
