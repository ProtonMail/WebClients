import { useState } from 'react';

import { c } from 'ttag';

import { useAddresses } from '@proton/account/addresses/hooks';
import BYOEClaimProtonAddressModal from '@proton/activation/src/components/Modals/BYOEClaimProtonAddressModal/BYOEClaimProtonAddressModal';
import { ProductCheckbox } from '@proton/activation/src/components/Modals/ProductSelectionModal/ProductCheckbox';
import { ProductItem } from '@proton/activation/src/components/Modals/ProductSelectionModal/ProductItem';
import { useProductSelectionSubmit } from '@proton/activation/src/components/Modals/ProductSelectionModal/useProductSelectionSubmit';
import { EasySwitchProviderName } from '@proton/activation/src/components/ProviderName/EasySwitchProviderName';
import { BYOE_CLAIM_PROTON_ADDRESS_SOURCE } from '@proton/activation/src/constants';
import { type EASY_SWITCH_SOURCES, ImportProvider, ImportType } from '@proton/activation/src/interface';
import { Button } from '@proton/atoms/Button/Button';
import { CircledNumber } from '@proton/atoms/CircledNumber/CircledNumber';
import { InlineLinkButton } from '@proton/atoms/InlineLinkButton/InlineLinkButton';
import { useWriteableCalendars } from '@proton/calendar/calendars/hooks';
import { BorderedContainer, BorderedContainerItem, type ModalProps, ModalTwo, Option, Radio } from '@proton/components';
import ModalContent from '@proton/components/components/modalTwo/ModalContent';
import ModalFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalHeader from '@proton/components/components/modalTwo/ModalHeader';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import SelectTwo from '@proton/components/components/selectTwo/SelectTwo';
import useGetOrCreateCalendarAndSettings from '@proton/components/hooks/useGetOrCreateCalendarAndSettings';
import { APPS, BRAND_NAME, CALENDAR_APP_NAME } from '@proton/shared/lib/constants';
import { getIsBYOEOnlyAccount } from '@proton/shared/lib/helpers/address';
import isTruthy from '@proton/utils/isTruthy';

const importProviders = [ImportProvider.DEFAULT, ImportProvider.GOOGLE, ImportProvider.OUTLOOK, ImportProvider.YAHOO];
const importProducts = [ImportType.MAIL, ImportType.CONTACTS, ImportType.CALENDAR];

const getDefaultProducts = (provider: ImportProvider, hasCalendar: boolean) => {
    if (provider === ImportProvider.DEFAULT || provider === ImportProvider.YAHOO) {
        return [ImportType.MAIL];
    }

    return [ImportType.MAIL, hasCalendar ? ImportType.CALENDAR : undefined, ImportType.CONTACTS].filter(isTruthy);
};

interface Props extends ModalProps {
    source: EASY_SWITCH_SOURCES;
    provider: ImportProvider;
    onComplete?: () => Promise<void>;
}

export const ProductSelectionModal = ({ onClose, provider, source, onComplete, ...rest }: Props) => {
    const [addresses] = useAddresses();
    const isBYOEAccount = getIsBYOEOnlyAccount(addresses);
    const [writeableCalendars = []] = useWriteableCalendars();

    const { handleSubmit, loadingConfig } = useProductSelectionSubmit();

    const hasCalendar = !isBYOEAccount && writeableCalendars.length > 0;

    const [selectedProvider, setSelectedProvider] = useState(provider);
    const [selectedProducts, setSelectedProducts] = useState<ImportType[]>(getDefaultProducts(provider, hasCalendar));

    const [claimProtonAddressModalProps, setClaimProtonAddressModalOpen, renderClaimProtonAddressModal] =
        useModalState();
    const getOrCreateCalendarAndSettings = useGetOrCreateCalendarAndSettings();

    const handleProviderChange = (value: ImportProvider) => {
        setSelectedProducts(getDefaultProducts(value, hasCalendar));
        setSelectedProvider(value);
    };

    const handleSelectProductCheckbox = (product: ImportType, checked: boolean) => {
        setSelectedProducts((products) => {
            if (checked) {
                return [...products, product];
            }
            return products.filter((p) => p !== product);
        });
    };

    const disabledProductText = c('Info').t`Temporarily unavailable. Please check back later.`;
    const getCalendarDisabledText = () => {
        if (getIsBYOEOnlyAccount(addresses)) {
            const claimAddressButton = (
                <InlineLinkButton onClick={() => setClaimProtonAddressModalOpen(true)} key="free-address-cta">
                    {c('Action').t`Get a free ${BRAND_NAME} address`}
                </InlineLinkButton>
            );

            /*translator: full sentence is "Proton calendar requires a Proton address for secure event sync and encryption. Create a free Proton address."*/
            return c('Info')
                .jt`${CALENDAR_APP_NAME} requires a ${BRAND_NAME} address for secure event sync and encryption. ${claimAddressButton}.`;
        }

        return c('Info')
            .t`To import events, first create a calendar in ${CALENDAR_APP_NAME}. This is where the events will appear after the import.`;
    };

    return (
        <>
            <ModalTwo onClose={onClose} {...rest} data-testid="EasySwitch:ImportModal">
                <ModalHeader title={c('Title').t`Import your data to ${BRAND_NAME}`} />
                <ModalContent>
                    <div className="flex flex-column gap-5">
                        <div>
                            <div className="flex flex-row flex-nowrap gap-2 mb-2">
                                <CircledNumber number={1} />
                                <span className="flex-1 color-weak">{c('Title').t`Choose a provider`}</span>
                            </div>
                            <SelectTwo
                                value={selectedProvider}
                                onValue={handleProviderChange}
                                className="border-weak px-5 py-3 h-auto rounded-xl"
                                data-testid="productSelectionModal:selectProvider"
                            >
                                {importProviders.map((provider) => (
                                    <Option key={provider} value={provider} title={provider}>
                                        <EasySwitchProviderName
                                            provider={provider}
                                            data-testid={`productSelectionModal:${provider}`}
                                        />
                                    </Option>
                                ))}
                            </SelectTwo>
                        </div>

                        <div>
                            <div className="flex flex-row flex-nowrap gap-2 mb-2">
                                <CircledNumber number={2} />
                                <span className="flex-1 color-weak">{c('Title').t`Select data to import`}</span>
                            </div>
                            {(selectedProvider === ImportProvider.GOOGLE ||
                                selectedProvider === ImportProvider.OUTLOOK) && (
                                <BorderedContainer>
                                    <BorderedContainerItem>
                                        <ProductCheckbox
                                            product={ImportType.MAIL}
                                            onToggleProduct={handleSelectProductCheckbox}
                                            checked={selectedProducts.includes(ImportType.MAIL)}
                                            disabledText={disabledProductText}
                                        />
                                    </BorderedContainerItem>
                                    <BorderedContainerItem>
                                        <ProductCheckbox
                                            product={ImportType.CONTACTS}
                                            onToggleProduct={handleSelectProductCheckbox}
                                            checked={selectedProducts.includes(ImportType.CONTACTS)}
                                            disabledText={disabledProductText}
                                        />
                                    </BorderedContainerItem>
                                    <BorderedContainerItem>
                                        <ProductCheckbox
                                            product={ImportType.CALENDAR}
                                            onToggleProduct={handleSelectProductCheckbox}
                                            disabled={!hasCalendar}
                                            checked={selectedProducts.includes(ImportType.CALENDAR)}
                                            disabledText={getCalendarDisabledText()}
                                        />
                                    </BorderedContainerItem>
                                </BorderedContainer>
                            )}
                            {(selectedProvider === ImportProvider.YAHOO ||
                                selectedProvider === ImportProvider.DEFAULT) && (
                                <BorderedContainer>
                                    {importProducts.map((option) => {
                                        const disabled = option === ImportType.CALENDAR && !hasCalendar;
                                        const disabledText =
                                            option === ImportType.CALENDAR ? getCalendarDisabledText() : undefined;
                                        const product = option as ImportType;
                                        return (
                                            <BorderedContainerItem key={option}>
                                                <Radio
                                                    id={`selected-product-${option}`}
                                                    name="selected-product"
                                                    className="flex flex-row flex-nowrap gap-2"
                                                    onChange={() => {
                                                        setSelectedProducts([product]);
                                                    }}
                                                    checked={selectedProducts.includes(option)}
                                                    value={option}
                                                    data-testid={`productRadio:${product}`}
                                                    children={
                                                        <ProductItem
                                                            product={product}
                                                            disabled={disabled}
                                                            disabledText={disabledText}
                                                        />
                                                    }
                                                ></Radio>
                                            </BorderedContainerItem>
                                        );
                                    })}
                                </BorderedContainer>
                            )}
                        </div>
                    </div>
                </ModalContent>
                <ModalFooter>
                    <Button onClick={onClose}>{c('Action').t`Cancel`}</Button>
                    <Button
                        onClick={async () => {
                            handleSubmit(selectedProvider, selectedProducts, source);
                            onClose?.();
                            await onComplete?.();
                        }}
                        color="norm"
                        disabled={loadingConfig}
                    >
                        {c('Action').t`Continue`}
                    </Button>
                </ModalFooter>
            </ModalTwo>

            {renderClaimProtonAddressModal && (
                <BYOEClaimProtonAddressModal
                    toApp={APPS.PROTONMAIL}
                    onCreateCalendar={getOrCreateCalendarAndSettings}
                    source={BYOE_CLAIM_PROTON_ADDRESS_SOURCE.EASY_SWITCH}
                    {...claimProtonAddressModalProps}
                />
            )}
        </>
    );
};
