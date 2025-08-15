import React, { useState } from 'react';

import { c } from 'ttag';

import {
    type WasmAccount,
    WasmAccountStatementGenerator,
    type WasmApiExchangeRate,
    type WasmApiWalletAccount,
} from '@proton/andromeda';
import type { ButtonProps } from '@proton/atoms';
import { Icon, useModalState, useNotifications } from '@proton/components';
import { useLoading } from '@proton/hooks/index';
import { SECOND } from '@proton/shared/lib/constants';
import walletDownloadDark from '@proton/styles/assets/img/wallet/wallet-download-dark.png';
import walletDownload from '@proton/styles/assets/img/wallet/wallet-download.png';
import useFlag from '@proton/unleash/useFlag';
import clsx from '@proton/utils/clsx';
import type { IWasmApiWalletData, WalletChainDataByWalletId } from '@proton/wallet';
import { useWalletAccountExchangeRate } from '@proton/wallet/store';
import { WalletThemeOption } from '@proton/wallet/utils/theme';

import { Button, CoreButton, Modal, Select } from '../../atoms';
import { useBitcoinBlockchainContext } from '../../contexts';
import { useResponsiveContainerContext } from '../../contexts/ResponsiveContainerContext';
import { ExportFormat } from '../../utils';
import DateInput from '../DateInput';
import { useWalletTheme } from '../Layout/Theme/WalletThemeProvider';

interface Props extends ButtonProps {
    apiWalletData: IWasmApiWalletData;
    apiAccount?: WasmApiWalletAccount;
}

interface GetAccountsProps {
    account: WasmAccount;
    name: string;
}

export const ExportStatementButton = ({ apiWalletData, apiAccount, ...rest }: Props) => {
    const hasWalletExportTransaction = useFlag('WalletExportTransaction');
    const { isNarrow } = useResponsiveContainerContext();
    const { walletsChainData } = useBitcoinBlockchainContext();
    const theme = useWalletTheme();
    const [loading, withLoading] = useLoading();
    const [exchangeRate, loadingExchangeRate] = useWalletAccountExchangeRate(
        apiAccount ?? apiWalletData.WalletAccounts[0]
    );
    const [format, setFormat] = useState(ExportFormat.PDF);
    const [exportModal, setExportModal, renderExportModal] = useModalState();
    const { createNotification } = useNotifications();

    const currentDate = new Date();
    const [date, setDate] = useState<Date>(currentDate);

    const handleDateChange = (change: Date | undefined) => {
        if (change) {
            setDate(change);
        }
    };

    const getAccounts = (
        walletsChainData: WalletChainDataByWalletId,
        apiWalletData: IWasmApiWalletData,
        apiAccount?: WasmApiWalletAccount
    ): GetAccountsProps[] => {
        if (apiAccount) {
            const account = walletsChainData[apiAccount.WalletID]?.accounts?.[apiAccount.ID]?.account;
            return account ? [{ account, name: apiAccount.Label }] : [];
        }
        return apiWalletData.WalletAccounts.map(({ ID, Label }) => {
            const account = walletsChainData[apiWalletData.Wallet.ID]?.accounts?.[ID]?.account;
            return account ? { account, name: Label } : null;
        }).filter(Boolean) as GetAccountsProps[];
    };

    const getData = async (generator: WasmAccountStatementGenerator, format: ExportFormat): Promise<Uint8Array<ArrayBuffer>> => {
        const time = BigInt(Math.floor(date.getTime() / SECOND).toString());

        if (format === ExportFormat.CSV) {
            return generator.toCsv(time) as Promise<Uint8Array<ArrayBuffer>>;
        }

        return generator.toPdf(time) as Promise<Uint8Array<ArrayBuffer>>;
    };

    const getMimeType = (format: ExportFormat): string => {
        switch (format) {
            case ExportFormat.CSV:
                return 'text/csv';
            case ExportFormat.PDF:
                return 'application/pdf';
            default:
                throw new Error('Unsupported format');
        }
    };

    const getFilename = (format: ExportFormat): string => {
        const dateString = date.toISOString().split('T')[0];
        return `account_statement_${dateString}.${format.toLowerCase()}`;
    };

    const exportStatement = async (
        walletsChainData: WalletChainDataByWalletId,
        apiWalletData: IWasmApiWalletData,
        apiAccount?: WasmApiWalletAccount,
        exchangeRate?: WasmApiExchangeRate
    ): Promise<void> => {
        const generator = new WasmAccountStatementGenerator(exchangeRate);
        for (const { account, name } of getAccounts(walletsChainData, apiWalletData, apiAccount)) {
            await generator.addAccount(account, name);
        }
        const data = await getData(generator, format);
        generator.free();

        const blob = new Blob([data], { type: getMimeType(format) });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.download = getFilename(format);
        a.href = url;
        document.body.appendChild(a);
        a.click();
        a.remove();

        createNotification({
            type: 'success',
            text: c('Account statement').t`Account statement successfully generated`,
        });
    };

    if (!hasWalletExportTransaction) {
        return <></>;
    }

    return (
        <>
            <CoreButton
                icon
                size={isNarrow ? 'small' : 'medium'}
                shape="ghost"
                color="weak"
                className="ml-2 rounded-full bg-weak"
                disabled={loadingExchangeRate || rest.disabled}
                onClick={() => setExportModal(true)}
            >
                <Icon
                    alt={c('Account statement').t`Download transactions`}
                    name="arrow-down-line"
                    size={isNarrow ? 4 : 5}
                />
            </CoreButton>

            {renderExportModal && (
                <Modal size="small" {...exportModal}>
                    <div className="flex flex-column items-center">
                        <img
                            className="h-custom w-custom"
                            src={theme === WalletThemeOption.WalletDark ? walletDownloadDark : walletDownload}
                            alt=""
                            style={{ '--w-custom': '15rem', '--h-custom': '10.438rem' }}
                        />
                        <h1 className={clsx('text-bold text-break text-4xl')}>
                            {c('Account statement').t`Download transactions`}
                        </h1>
                        <p className="mb-5 text-center">{c('Account statement')
                            .t`Export your transactions for tax reporting or personal record-keeping. Choose your preferred format and download your file instantly.`}</p>
                    </div>

                    <div className="flex flex-col">
                        <div className="mb-5 w-full">
                            <DateInput
                                value={date}
                                onChange={handleDateChange}
                                max={currentDate}
                                className={'export-statement-button-date-input'}
                            />
                        </div>
                        <Select
                            label={c('Account statement').t`Export format`}
                            id="export-format-selector"
                            aria-describedby="label-export-format"
                            value={format}
                            disabled={loading}
                            onChange={(v) => setFormat(ExportFormat[v.value as keyof typeof ExportFormat])}
                            options={Object.keys(ExportFormat).map((value) => ({
                                label: value,
                                value: value,
                                id: value,
                                children: <div className="flex flex-row items-center py-2">{value}</div>,
                            }))}
                            renderSelected={(selected) => selected}
                        />
                        <Button
                            disabled={loading}
                            fullWidth
                            className="mt-5"
                            shape="solid"
                            color="norm"
                            onClick={() =>
                                withLoading(exportStatement(walletsChainData, apiWalletData, apiAccount, exchangeRate))
                            }
                        >{c('Account statement').t`Download`}</Button>
                    </div>
                </Modal>
            )}
        </>
    );
};
