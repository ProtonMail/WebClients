import type { FormEvent } from 'react';
import { type FC, useState } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { Banner, Button } from '@proton/atoms';
import { Checkbox, ModalTwoContent, ModalTwoFooter, ModalTwoHeader } from '@proton/components';
import { PassModal } from '@proton/pass/components/Layout/Modal/PassModal';
import { VaultIcon } from '@proton/pass/components/Vault/VaultIcon';
import { isShareVisible } from '@proton/pass/lib/shares/share.predicates';
import { selectAllVaults } from '@proton/pass/store/selectors';
import type { ShareHiddenMap, ShareId } from '@proton/pass/types';
import clsx from '@proton/utils/clsx';

const FORM_ID = 'organize-vaults';
type Props = { onClose: () => void; onConfirm: (hideMap: ShareHiddenMap) => void };

export const OrganizeVaultsModal: FC<Props> = ({ onClose, onConfirm }) => {
    const vaults = useSelector(selectAllVaults);
    const [hideMap, setHideMap] = useState<ShareHiddenMap>(
        Object.fromEntries(vaults.map((vault) => [vault.shareId, !isShareVisible(vault)]))
    );

    const handleChange = (shareId: ShareId) => () => setHideMap((prev) => ({ ...prev, [shareId]: !prev[shareId] }));

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        // Only send what changed
        const changeMap = vaults.reduce<ShareHiddenMap>((acc, vault) => {
            if (!isShareVisible(vault) !== hideMap[vault.shareId]) {
                acc[vault.shareId] = hideMap[vault.shareId];
            }
            return acc;
        }, {});
        onConfirm(changeMap);
    };

    console.warn('[DEBUG] OrganizeVaultsModal', { vaults, hideMap });

    return (
        <PassModal open onClose={onClose} enableCloseWhenClickOutside>
            <ModalTwoHeader title={c('Title').t`Organize vaults`} />
            <ModalTwoContent>
                <Banner noIcon>{c('Title').t`Hidden vaults won’t be visible during search and autofill.`}</Banner>

                <form id={FORM_ID} onSubmit={handleSubmit} className="pt-4">
                    {vaults.map((vault, index) => (
                        <Checkbox
                            key={vault.shareId}
                            checked={!hideMap[vault.shareId]}
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
                    // loading={loading}
                    // disabled={!form.isValid}
                    type="submit"
                    form={FORM_ID}
                    className="w-full"
                >
                    {c('Action').t`Save`}
                </Button>
            </ModalTwoFooter>
        </PassModal>
    );
};
