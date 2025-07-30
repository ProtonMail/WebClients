import type { FormEvent } from 'react';
import { type FC, useState } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { Banner, Button } from '@proton/atoms';
import { Checkbox, ModalTwoContent, ModalTwoFooter, ModalTwoHeader } from '@proton/components';
import { PassModal } from '@proton/pass/components/Layout/Modal/PassModal';
import { VaultIcon } from '@proton/pass/components/Vault/VaultIcon';
import { isShareVisible } from '@proton/pass/lib/shares/share.predicates';
import { intoShareVisibilityMap } from '@proton/pass/lib/shares/share.utils';
import { sharesVisibilityEdit } from '@proton/pass/store/actions';
import { selectAllIncludingHiddenVaults, selectRequestInFlight } from '@proton/pass/store/selectors';
import type { ShareId, ShareVisibilityMap } from '@proton/pass/types';
import clsx from '@proton/utils/clsx';

const FORM_ID = 'organize-vaults';
type Props = { onClose: () => void; onConfirm: (visibilityMap: ShareVisibilityMap) => void };

export const OrganizeVaultsModal: FC<Props> = ({ onClose, onConfirm }) => {
    const vaults = useSelector(selectAllIncludingHiddenVaults);
    const [visibilityMap, setVisibilityMap] = useState<ShareVisibilityMap>(() => intoShareVisibilityMap(vaults));

    const loading = useSelector(selectRequestInFlight(sharesVisibilityEdit.requestID()));

    const handleChange = (shareId: ShareId) => () =>
        setVisibilityMap((prev) => ({ ...prev, [shareId]: !prev[shareId] }));

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        /** Only include shares with changed visibility states. This prevents
         * issues when the initial visibility map becomes stale due to background
         * share updates while the modal is open. */
        const changeMap = vaults.reduce<ShareVisibilityMap>((acc, vault) => {
            if (isShareVisible(vault) !== visibilityMap[vault.shareId]) {
                acc[vault.shareId] = visibilityMap[vault.shareId];
            }
            return acc;
        }, {});

        onConfirm(changeMap);
    };

    return (
        <PassModal open onClose={onClose} enableCloseWhenClickOutside>
            <ModalTwoHeader title={c('Title').t`Organize vaults`} />
            <ModalTwoContent>
                <Banner noIcon>{c('Title').t`Hidden vaults won’t be visible during search and autofill.`}</Banner>

                <form id={FORM_ID} onSubmit={handleSubmit} className="pt-4">
                    {vaults.map((vault, index) => (
                        <Checkbox
                            key={vault.shareId}
                            checked={visibilityMap[vault.shareId]}
                            onChange={handleChange(vault.shareId)}
                            className={clsx(
                                'w-full px-4 py-2 pl-2 pr-2 items-center',
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
                            <span className="ellipsis">{vault.content.name}</span>
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
                    disabled={loading}
                >
                    {c('Action').t`Save`}
                </Button>
            </ModalTwoFooter>
        </PassModal>
    );
};
