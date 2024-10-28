import { c } from 'ttag';

import type { WasmScriptType } from '@proton/andromeda';
import Href from '@proton/atoms/Href/Href';
import Collapsible from '@proton/components/components/collapsible/Collapsible';
import CollapsibleContent from '@proton/components/components/collapsible/CollapsibleContent';
import CollapsibleHeader from '@proton/components/components/collapsible/CollapsibleHeader';
import CollapsibleHeaderIconButton from '@proton/components/components/collapsible/CollapsibleHeaderIconButton';
import Icon from '@proton/components/components/icon/Icon';
import type { ModalOwnProps } from '@proton/components/components/modalTwo/Modal';
import Tooltip from '@proton/components/components/tooltip/Tooltip';
import useLoading from '@proton/hooks/useLoading';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import type { IWasmApiWalletData } from '@proton/wallet';
import { BASE_INDEX_OPTIONS, SCRIPT_TYPES } from '@proton/wallet';

import { Button, CoreButtonLike, Input, Modal, Select } from '../../atoms';
import { ModalParagraph } from '../../atoms/ModalParagraph';
import { ModalSectionHeader } from '../../atoms/ModalSection';
import { PASSWORD_MANAGER_IGNORE_PROPS } from '../../constants';
import type { SubTheme } from '../../utils';
import { getDescriptionByScriptType, getLabelByScriptType } from '../../utils';
import { useWalletAccountCreationModal } from './useWalletAccountCreationModal';

export interface WalletAccountCreationModalOwnProps {
    apiWalletData: IWasmApiWalletData;
    theme?: SubTheme;
}

type Props = ModalOwnProps & WalletAccountCreationModalOwnProps;

export const WalletAccountCreationModal = ({ apiWalletData, theme, ...modalProps }: Props) => {
    const [loading, withLoading] = useLoading();

    const {
        label,
        onLabelChange,

        selectedIndex,
        onIndexSelect,
        inputIndex,
        onIndexChange,

        indexesByScriptType,
        selectedScriptType,
        onScriptTypeSelect,

        createWalletAccount,
    } = useWalletAccountCreationModal(apiWalletData, modalProps.onClose);

    return (
        <Modal title={c('Wallet Account').t`Add wallet account`} className={theme} {...modalProps}>
            <ModalParagraph>
                <p>{c('Wallet Account')
                    .t`Create multiple wallet accounts to separate your financial activities for better privacy and organization.`}</p>
                <p>{c('Wallet Account')
                    .t`If you want to receive Bitcoin via Email with multiple email addresses, then you need to create a wallet account for each email.`}</p>
            </ModalParagraph>

            <Input
                label={c('Wallet Account').t`Name`}
                id="account-label-input"
                placeholder={c('Wallet Account').t`Savings for holiday`}
                {...PASSWORD_MANAGER_IGNORE_PROPS}
                value={label}
                disabled={loading}
                onChange={onLabelChange}
            />

            <Collapsible className="my-2">
                <CollapsibleHeader
                    className="color-weak"
                    suffix={
                        <CollapsibleHeaderIconButton className="color-weak">
                            <Icon name="chevron-down" />
                        </CollapsibleHeaderIconButton>
                    }
                >{c('Wallet account').t`Advanced settings`}</CollapsibleHeader>
                <CollapsibleContent>
                    <div className="flex flex-column items-center">
                        <ModalSectionHeader header={c('Wallet account').t`Address Type`}>
                            {c('Wallet account')
                                .t`We default to Native Segwit, which has the lowest network fees. You can change this to receive bitcoin from other services that only support other types.`}
                        </ModalSectionHeader>
                        <Select
                            label={c('Wallet Account').t`Address type`}
                            id="account-script-type-selector"
                            aria-describedby="label-account-script-type"
                            value={selectedScriptType}
                            disabled={loading}
                            onChange={onScriptTypeSelect}
                            options={SCRIPT_TYPES.map((opt) => ({
                                label: getLabelByScriptType(opt as WasmScriptType),
                                value: opt,
                                id: opt.toString(),
                                children: (
                                    <div className="flex flex-row items-center py-2">
                                        {getLabelByScriptType(opt as WasmScriptType)}
                                        <Tooltip title={getDescriptionByScriptType(opt as WasmScriptType)}>
                                            <Icon name="info-circle" className="ml-auto color-hint" />
                                        </Tooltip>
                                    </div>
                                ),
                            }))}
                            renderSelected={(selected) => getLabelByScriptType(selected as WasmScriptType)}
                        />

                        <CoreButtonLike
                            className="my-3 mr-auto"
                            shape="underline"
                            color="norm"
                            as={Href}
                            href={getKnowledgeBaseUrl('/wallet-create-btc-account#bitcoin-address-type')}
                        >{c('Action').t`Learn more`}</CoreButtonLike>
                    </div>

                    <div className="flex flex-column items-center">
                        <ModalSectionHeader header={c('Wallet account').t`Account Index`}>
                            {c('Wallet account')
                                .t`We default to the next unused index. You can change this to recover or to skip a previous account.`}
                        </ModalSectionHeader>
                        <div className="flex flex-row mt-2 w-full">
                            <div className="grow">
                                <Select
                                    label={
                                        <div className="flex flex-row">
                                            <span className="block mr-1">{c('Wallet Account').t`Account index`}</span>
                                        </div>
                                    }
                                    id="account-index-selector"
                                    data-testid="account-index-selector"
                                    aria-describedby="label-account-index"
                                    value={BASE_INDEX_OPTIONS.includes(selectedIndex) ? selectedIndex : 'custom'}
                                    disabled={loading}
                                    onChange={onIndexSelect}
                                    options={BASE_INDEX_OPTIONS.map((index) => ({
                                        label: index.toString(),
                                        value: index,
                                        id: index.toString(),
                                        disabled: indexesByScriptType[selectedScriptType]?.has(Number(index)),
                                    }))}
                                />
                            </div>

                            {!Number.isInteger(selectedIndex) && (
                                <div className="ml-2">
                                    <Input
                                        label={c('Wallet Account').t`Custom account index`}
                                        id="custom-account-index-input"
                                        placeholder={c('Wallet Account').t`Custom index`}
                                        value={inputIndex}
                                        min={0}
                                        type="number"
                                        disabled={loading}
                                        onChange={onIndexChange}
                                        error={
                                            indexesByScriptType[selectedScriptType]?.has(inputIndex) &&
                                            c('Wallet account').t`This account is already created`
                                        }
                                    />
                                </div>
                            )}
                        </div>

                        <CoreButtonLike
                            className="my-3 mr-auto"
                            shape="underline"
                            color="norm"
                            as={Href}
                            href={getKnowledgeBaseUrl('/wallet-create-btc-account#bitcoin-address-index-type')}
                        >{c('Action').t`Learn more`}</CoreButtonLike>
                    </div>
                </CollapsibleContent>
            </Collapsible>

            <div className="mt-4 flex flex-col">
                <Button
                    disabled={loading}
                    fullWidth
                    className="mt-2"
                    shape="solid"
                    color="norm"
                    onClick={() => {
                        void withLoading(createWalletAccount());
                    }}
                >{c('Wallet Account').t`Create wallet account`}</Button>
                <Button
                    disabled={loading}
                    fullWidth
                    shape="ghost"
                    color="weak"
                    onClick={() => modalProps.onClose?.()}
                    className="mt-2"
                >{c('Wallet Account').t`Cancel`}</Button>
            </div>
        </Modal>
    );
};
