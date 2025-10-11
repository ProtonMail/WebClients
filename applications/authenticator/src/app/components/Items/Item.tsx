import { type FC, Fragment, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Menu, type MenuItemOptions } from '@tauri-apps/api/menu';
import { OtpLogo } from 'proton-authenticator/app/components/Otp/OtpLogo';
import { useOTPOrchestrator } from 'proton-authenticator/app/components/Otp/OtpOrchestrator';
import { useCodeAnimation } from 'proton-authenticator/app/hooks/useCodeAnimation';
import type { Item as DatabaseItem } from 'proton-authenticator/lib/db/entities/items';
import { toWasmEntry } from 'proton-authenticator/lib/entries/items';
import logger from 'proton-authenticator/lib/logger';
import { service } from 'proton-authenticator/lib/wasm/service';
import { c } from 'ttag';

import Marks from '@proton/components/components/text/Marks';
import useNotifications from '@proton/components/hooks/useNotifications';
import { DEFAULT_OTP_COLORS, OTPDonut } from '@proton/pass/components/Otp/OTPDonut';
import type { IOtpRenderer } from '@proton/pass/components/Otp/types';
import { matchChunks } from '@proton/pass/lib/search/match-chunks';
import type { Maybe, MaybeNull } from '@proton/pass/types/utils';
import { safeCall } from '@proton/pass/utils/fp/safe-call';
import noop from '@proton/utils/noop';

const HIDDEN_CHAR = '·';

export type ItemProps = {
    animateCodes?: boolean;
    digitStyle?: 'plain' | 'boxed';
    disabled?: boolean;
    hideCodes?: boolean;
    item: DatabaseItem;
    search?: string;
    syncing?: boolean;
    onDelete?: (item: DatabaseItem) => void;
    onEdit?: (item: DatabaseItem) => void;
};

type CodeDisplayProps = Pick<ItemProps, 'animateCodes' | 'hideCodes'> & { code: string };

const BoxedCode: FC<CodeDisplayProps> = ({ animateCodes, code, hideCodes }) => {
    const { animationKey, getAnimationStyles } = useCodeAnimation(code, animateCodes);

    return (
        <div className="flex flex-nowrap gap-1" key={animationKey}>
            {[...code].map((char, i) => (
                <div className="border rounded-sm px-1" key={`char-${i}`}>
                    <span style={getAnimationStyles(i)}>{hideCodes ? HIDDEN_CHAR : char}</span>
                </div>
            ))}
        </div>
    );
};

const PlainCode: FC<CodeDisplayProps> = ({ animateCodes, code, hideCodes }) => {
    const { animationKey, getAnimationStyles } = useCodeAnimation(code, animateCodes);

    const formattedGroups = useMemo(() => {
        const size = (() => {
            if (code.length > 4 && code.length % 4 === 0) return 4;
            if (code.length % 3 === 0) return 3;
            return code.length;
        })();

        const groups: string[][] = [];
        let currentGroup: string[] = [];

        code.split('').forEach((char, index) => {
            if (index % size === 0 && index !== 0) {
                groups.push(currentGroup);
                currentGroup = [];
            }
            currentGroup.push(hideCodes ? HIDDEN_CHAR : char);
        });

        if (currentGroup.length > 0) groups.push(currentGroup);

        return groups;
    }, [code, hideCodes]);

    return (
        <div key={animationKey}>
            {formattedGroups.map((group, groupIndex) => (
                <Fragment key={groupIndex}>
                    {groupIndex > 0 && <span> </span>}
                    {group.map((char, charIndex) => (
                        <span key={`${groupIndex}-${charIndex}`} style={getAnimationStyles(charIndex)}>
                            {char}
                        </span>
                    ))}
                </Fragment>
            ))}
        </div>
    );
};

const CodeDisplay: FC<CodeDisplayProps & Pick<ItemProps, 'digitStyle'>> = ({ digitStyle, ...props }) => {
    const Component = digitStyle === 'boxed' ? BoxedCode : PlainCode;
    return <Component {...props} />;
};

type ItemCode = { code: string; nextCode: string };

const generateCodes = safeCall((item: DatabaseItem): ItemCode => {
    const now = BigInt(Math.floor(Date.now() / 1000));
    const data = service.generate_code(toWasmEntry(item), now);
    return { code: data.current_code, nextCode: data.next_code };
});

const ItemRender: FC<ItemProps> = ({
    item,
    syncing = false,
    disabled = false,
    animateCodes = false,
    digitStyle = 'plain',
    hideCodes = false,
    search = '',
    onDelete = noop,
    onEdit = noop,
}) => {
    const { name, period, issuer } = item;
    const orchestrator = useOTPOrchestrator();
    const otpRenderer = useRef<MaybeNull<IOtpRenderer>>(null);
    const didMount = useRef(false);
    const [state, setState] = useState<Maybe<ItemCode>>(() => generateCodes(item));

    const { createNotification } = useNotifications();

    const copy = useCallback(async () => {
        try {
            if (!state?.code) throw new Error('Nothing to copy');
            await navigator.clipboard.writeText(state.code);
            createNotification({ text: c('authenticator-2025:Info').t`One-time code copied` });
        } catch (err) {
            logger.error(`[Item::copy] Failed to copy ${err}`);
        }
    }, [state?.code, createNotification]);

    const handleContextMenu = useCallback(
        async (e: React.MouseEvent) => {
            e.preventDefault();

            const items: MenuItemOptions[] = [
                {
                    id: 'edit',
                    text: c('authenticator-2025:Action').t`Edit`,
                    action: () => onEdit(item),
                    enabled: !disabled,
                },
                {
                    id: 'delete',
                    text: c('authenticator-2025:Action').t`Delete`,
                    action: () => onDelete(item),
                    enabled: !disabled,
                },
            ];

            const menu = await Menu.new({ id: 'menu', items });
            await menu.popup();
        },
        [item, onEdit, onDelete, disabled]
    );

    useEffect(() => {
        /** Skip redundant code generation on initial mount */
        if (!didMount.current) didMount.current = true;
        else setState(generateCodes(item));

        if (otpRenderer.current) {
            return orchestrator.registerRenderer({
                renderer: otpRenderer.current,
                period,
                onEvent: (evt) => {
                    /** Update codes when orchestrator event period matches and remaining time
                     * is close to the full period (within 250ms of cycle completion) */
                    if (evt.period === period && evt.remaining >= period - 0.25) {
                        requestAnimationFrame(() => setState(generateCodes(item)));
                    }
                },
            });
        }
        /** Only trigger regeneration when core OTP properties change.
         * Item objects are unstable during DB operations. */
    }, [item.entryType, item.period, item.secret, item.uri]);

    return (
        <button
            aria-label={c('Action').t`Copy ${issuer} (${name})`}
            type="button"
            className="item"
            onClick={copy}
            tabIndex={0}
            onContextMenu={handleContextMenu}
            disabled={disabled}
        >
            <div className="flex items-center gap-2 flex-nowrap">
                <OtpLogo issuer={issuer} name={name} syncing={syncing} />
                <div className="title grow">
                    <div className="text-semibold text-ellipsis">
                        <Marks chunks={matchChunks(issuer, search)}>{issuer}</Marks>
                    </div>

                    <div className="color-weak text-sm text-ellipsis">
                        <Marks chunks={matchChunks(name, search)}>{name}</Marks>
                    </div>
                </div>
                <div className="counter shrink-0">
                    <OTPDonut
                        ref={otpRenderer}
                        colors={{ ...DEFAULT_OTP_COLORS, filled: '--primary', empty: '--interaction-weak' }}
                        enabled
                    />
                </div>
            </div>

            <div className="divider" />

            <div className="flex items-center">
                <div className="text-monospace text-semibold text-5xl grow">
                    <CodeDisplay
                        code={state?.code ?? '-'}
                        animateCodes={animateCodes}
                        hideCodes={hideCodes}
                        digitStyle={digitStyle}
                    />
                </div>
                <div>
                    <div className="color-weak text-sm">{c('Label').t`Next`}</div>
                    <div className="text-monospace text-md">
                        <CodeDisplay
                            code={state?.nextCode ?? '-'}
                            hideCodes={hideCodes}
                            animateCodes={false}
                            digitStyle="plain"
                        />
                    </div>
                </div>
            </div>
        </button>
    );
};

export const Item = memo(ItemRender);
