import type { ChangeEvent } from 'react';

import { c } from 'ttag';

import type { ModalOwnProps } from '@proton/components';
import { Checkbox, Tooltip } from '@proton/components';
import useLoading from '@proton/hooks/useLoading';
import walletNotFoundImg from '@proton/styles/assets/img/illustrations/wallet_not_found.svg';
import clsx from '@proton/utils/clsx';

import { Button, Input, Modal } from '../../atoms';
import { ModalParagraph } from '../../atoms/ModalParagraph';
import { useUnknownSenderModal } from './useUnknownSenderModal';

export interface WalletCreationModalOwnProps {
    hashedTxId: string;
}

type Props = ModalOwnProps & WalletCreationModalOwnProps;

export const UnknownSenderModal = ({ hashedTxId, ...modalProps }: Props) => {
    const [loadingSenderUpdate, withLoadingSenderUpdate] = useLoading();

    const {
        name,
        email,
        error,
        shouldSaveAsContact,
        loadingUserKeys,
        alreadyExistsAsContact,
        setEmail,
        setName,
        setShouldSaveAsContact,
        handleClickSaveSender,
    } = useUnknownSenderModal({
        hashedTxId,
        onClose: modalProps.onClose,
    });

    return (
        <Modal size="medium" {...modalProps}>
            <div className="flex flex-column items-center">
                <img src={walletNotFoundImg} alt="" className="mb-7" style={{ width: '5rem' }} />
                <h1 className={clsx('text-bold text-break text-4xl mb-2')}>{c('Unknown sender').t`Unknown sender`}</h1>
                <ModalParagraph>
                    <p>{c('Unknown sender').t`Not a Bitcoin via Email transaction.`}</p>
                    <p>{c('Unknown sender').t`Add a name so you can remember who it was from.`}</p>
                </ModalParagraph>
                <div className="w-full flex flex-column">
                    <div>
                        <Input
                            label={c('Unknown sender').t`Name`}
                            placeholder={c('Unknown sender').t`Give a name to this sender`}
                            value={name}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                setName(e.target.value);
                            }}
                        />
                    </div>

                    <div className="mt-2">
                        <Input
                            label={c('Unknown sender').t`Email address`}
                            placeholder={c('Unknown sender').t`Add their email address or leave empty`}
                            value={email}
                            error={error}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                setEmail(e.target.value);
                                if (!e.target.value) {
                                    setShouldSaveAsContact(false);
                                }
                            }}
                        />
                    </div>

                    {!alreadyExistsAsContact && (
                        <div className="flex flex-row items-start mt-2 gap-2">
                            <Tooltip
                                title={!email && c('Unknown sender').t`Add their email address to save as contact`}
                            >
                                <div className="block">
                                    <Checkbox
                                        id="save-as-contact"
                                        disabled={!email}
                                        checked={shouldSaveAsContact}
                                        onClick={() => {
                                            setShouldSaveAsContact((prev) => !prev);
                                        }}
                                    />
                                    <label className="ml-2" htmlFor="save-as-contact">{c('Unknown sender')
                                        .t`Save as a contact`}</label>
                                </div>
                            </Tooltip>
                        </div>
                    )}
                </div>

                <Button
                    fullWidth
                    className="mt-8 mx-auto"
                    size="large"
                    shape="solid"
                    color="norm"
                    disabled={!(email || name) || loadingSenderUpdate || loadingUserKeys || !!error}
                    onClick={() => {
                        void withLoadingSenderUpdate(handleClickSaveSender());
                    }}
                >{c('Unknown sender').t`Save sender`}</Button>
            </div>
        </Modal>
    );
};
