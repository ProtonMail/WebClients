import { c } from 'ttag';

import type { WasmApiWalletAccount } from '@proton/andromeda';
import Collapsible from '@proton/components/components/collapsible/Collapsible';
import CollapsibleContent from '@proton/components/components/collapsible/CollapsibleContent';
import CollapsibleHeader from '@proton/components/components/collapsible/CollapsibleHeader';
import CollapsibleHeaderIconButton from '@proton/components/components/collapsible/CollapsibleHeaderIconButton';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import { IcChevronDown } from '@proton/icons/icons/IcChevronDown';
import { useFlag } from '@proton/unleash/useFlag';

import { Button } from '../../../atoms';
import { ImportPaperWalletModal } from '../../../components/ImportPaperWalletModal';

interface Props {
    account: WasmApiWalletAccount;
    onClose?: () => void;
}

export const WalletReceiveExtraContent = ({ account, onClose }: Props) => {
    const [importPaperWalletModal, setImportPaperWalletModal, renderImportPaperWalletModal] = useModalState();

    const isImportPaperWalletAllowed = useFlag('ImportPaperWallet');

    if (!isImportPaperWalletAllowed) {
        return <></>;
    }

    return (
        <>
            <div className="flex flex-column mt-5 w-full">
                <Collapsible>
                    <CollapsibleHeader
                        className="color-weak"
                        suffix={
                            <CollapsibleHeaderIconButton className="color-weak">
                                <IcChevronDown />
                            </CollapsibleHeaderIconButton>
                        }
                    >
                        {c('Wallet Receive').t`More options`}
                    </CollapsibleHeader>
                    <CollapsibleContent>
                        <div className="flex flex-column items-center gap-2 mt-5">
                            <Button
                                data-testid={'import-paper-wallet'}
                                fullWidth
                                shape="ghost"
                                size="large"
                                onClick={() => {
                                    setImportPaperWalletModal(true);
                                }}
                                style={{ pointerEvents: 'auto' }}
                            >
                                <span className="flex gap-2 items-center text-center justify-center">
                                    {c('Wallet Receive').t`Import paper wallet`}
                                </span>
                            </Button>
                        </div>
                    </CollapsibleContent>
                </Collapsible>
            </div>

            {renderImportPaperWalletModal && (
                <ImportPaperWalletModal account={account} onCloseDrawer={onClose} {...importPaperWalletModal} />
            )}
        </>
    );
};
