import type { FC, FormEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { Banner } from '@proton/atoms/Banner/Banner';
import { Button } from '@proton/atoms/Button/Button';
import Icon from '@proton/components/components/icon/Icon';
import Checkbox from '@proton/components/components/input/Checkbox';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import { PassModal } from '@proton/pass/components/Layout/Modal/PassModal';
import { VaultIcon } from '@proton/pass/components/Vault/VaultIcon';
import { isShareVisible } from '@proton/pass/lib/shares/share.predicates';
import { intoShareVisibilityMap } from '@proton/pass/lib/shares/share.utils';
import { sharesVisibilityEdit } from '@proton/pass/store/actions';
import { selectAllVaults, selectRequestInFlight } from '@proton/pass/store/selectors';
import type { ShareId, ShareVisibilityMap, VaultsVisibilityDTO } from '@proton/pass/types';
import clsx from '@proton/utils/clsx';

const FORM_ID = 'organize-vaults';
const ICON_PROPS = { color: "var('--interaction-norm-contrast')", size: 3.5 } as const;

type Props = {
    onClose: () => void;
    onConfirm: (visibility: VaultsVisibilityDTO) => void;
};

export const OrganizeVaultsModal: FC<Props> = ({ onClose, onConfirm }) => {
    const vaults = useSelector(selectAllVaults);
    const [visibilityMap, setVisibilityMap] = useState<ShareVisibilityMap>({});
    const loading = useSelector(selectRequestInFlight(sharesVisibilityEdit.requestID()));

    const dirty = useMemo((): boolean => {
        const current = intoShareVisibilityMap(vaults);
        return Object.keys(visibilityMap).some((shareId) => current[shareId] !== visibilityMap[shareId]);
    }, [visibilityMap, vaults]);

    const handleChange = (shareId: ShareId) => () =>
        setVisibilityMap((prev) => ({ ...prev, [shareId]: !prev[shareId] }));

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const dto = vaults.reduce<VaultsVisibilityDTO>(
            (acc, vault) => {
                /** Only include shares with changed visibility states. This
                 * prevents issues when the initial visibility map becomes stale
                 * due to background share updates while the modal is open. */
                if (isShareVisible(vault) !== visibilityMap[vault.shareId]) {
                    const visible = visibilityMap[vault.shareId];
                    acc[visible ? 'sharesToUnhide' : 'sharesToHide'].push(vault.shareId);
                }

                return acc;
            },
            { sharesToHide: [], sharesToUnhide: [] }
        );

        onConfirm(dto);
    };

    useEffect(
        () =>
            setVisibilityMap((prev) => {
                const next = intoShareVisibilityMap(vaults);
                for (const shareId in prev) next[shareId] = prev[shareId];
                return next;
            }),
        [vaults]
    );

    return (
        <PassModal open onClose={onClose} enableCloseWhenClickOutside>
            <ModalTwoHeader title={c('Title').t`Organize vaults`} closeButtonProps={{ pill: true }} />
            <ModalTwoContent>
                <Banner noIcon>{c('Title').t`Hidden vaults won’t be visible during search and autofill.`}</Banner>

                <form id={FORM_ID} onSubmit={handleSubmit} className="pt-4">
                    {vaults.map((vault, index) => (
                        <Checkbox
                            key={vault.shareId}
                            checked={visibilityMap[vault.shareId] ?? true}
                            onChange={handleChange(vault.shareId)}
                            className={clsx(
                                'flex flex-nowrap w-full px-4 py-2 pl-2 pr-2 items-center',
                                index !== vaults.length - 1 && 'border-bottom border-weak'
                            )}
                        >
                            <VaultIcon
                                background
                                className="shrink-0 mr-1"
                                size={4}
                                color={vault.content.display.color}
                                icon={vault.content.display.icon}
                            />
                            <span className="flex-1 text-ellipsis">{vault.content.name}</span>
                            {vault.shared && <Icon name="users" {...ICON_PROPS} />}
                        </Checkbox>
                    ))}
                </form>
            </ModalTwoContent>

            <ModalTwoFooter>
                <Button
                    size="large"
                    shape="solid"
                    color="norm"
                    pill
                    type="submit"
                    form={FORM_ID}
                    className="w-full"
                    /** Prevent concurrent requests when multiple
                     * extension clients are open simultaneously and
                     * a visibility update is already in progress */
                    disabled={loading || !dirty}
                >
                    {c('Action').t`Save`}
                </Button>
            </ModalTwoFooter>
        </PassModal>
    );
};
