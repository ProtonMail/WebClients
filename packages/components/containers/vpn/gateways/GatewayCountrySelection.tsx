import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms';
import Icon from '@proton/components/components/icon/Icon';
import type { SelectChangeEvent } from '@proton/components/components/selectTwo/select';
import { vpnEnterpriseContactUrl } from '@proton/components/containers/payments/subscription/helpers';
import { MAX_IPS_ADDON } from '@proton/shared/lib/constants';

import { Field, Label, Option, Row, SelectTwo } from '../../../components';
import { type CountryOptions, getLocalizedCountryByAbbr } from '../../../helpers/countries';
import { ButtonNumberInput } from './ButtonNumberInput';
import { CountryFlagAndName } from './CountryFlagAndName';
import type { GatewayDto } from './GatewayDto';

interface Props {
    singleServer: boolean;
    countries: readonly string[];
    ownedCount: number;
    usedCount: number;
    addedCount: number;
    countryOptions: CountryOptions;
    onUpsell: () => void;
    specificCountryCount: number;
    loading?: boolean;
    needUpsell: boolean;
    model: GatewayDto;
    changeModel: (diff: Partial<GatewayDto>) => void;
}

export const GatewayCountrySelection = ({
    singleServer,
    countries,
    ownedCount,
    usedCount,
    addedCount,
    countryOptions,
    onUpsell,
    loading = false,
    needUpsell,
    specificCountryCount,
    model,
    changeModel,
}: Props) => {
    const remainingCount = ownedCount - usedCount;
    const availableCount = Math.max(0, remainingCount - addedCount);
    const totalCountExceeded = addedCount > remainingCount;
    const canBuyMore = ownedCount < MAX_IPS_ADDON;

    const handleCountryChange = ({ value }: SelectChangeEvent<string>) => changeModel({ country: value });

    return singleServer ? (
        <Row>
            <Label htmlFor="domain">{c('Label').t`Country`}</Label>
            <Field>
                <SelectTwo value={model.country} onChange={handleCountryChange}>
                    {countries.map((country) => {
                        const title = getLocalizedCountryByAbbr(country, countryOptions) || country;
                        return (
                            <Option key={country} value={country} title={title}>
                                <CountryFlagAndName countryCode={country} countryName={title} />
                            </Option>
                        );
                    })}
                </SelectTwo>
            </Field>
        </Row>
    ) : (
        <>
            <p className="mb-2">
                {c('Info').ngettext(
                    msgid`You have ${availableCount} dedicated server available.`,
                    `You have ${availableCount} dedicated servers available.`,
                    availableCount
                )}
            </p>
            {countries.map((country) => {
                const title = getLocalizedCountryByAbbr(country, countryOptions);
                const id = `country-number-${country}`;
                return (
                    <div key={id} className="flex *:min-size-auto md:flex-nowrap items-center mb-4">
                        <Label htmlFor={id} className="flex-1">
                            <CountryFlagAndName countryCode={country} countryName={title} />
                        </Label>
                        <ButtonNumberInput
                            id={id}
                            value={model.quantities?.[country] || 0}
                            min={0}
                            max={99}
                            disabled={loading}
                            onChange={(newQuantity) => {
                                const quantities = {
                                    ...model.quantities,
                                    [country]: newQuantity,
                                };
                                const mainCountry = Object.keys(quantities).reduce(
                                    (previous, country) =>
                                        (quantities[country] || 0) > (quantities[previous] || 0) ? country : previous,
                                    'US'
                                );

                                if (mainCountry !== model.country) {
                                    changeModel({ country: mainCountry });
                                }

                                changeModel({ quantities });
                            }}
                            step={1}
                        />
                    </div>
                );
            })}
            <Row>
                {c('Info').t`Want servers in other countries?`}
                <a href={vpnEnterpriseContactUrl} className="ml-1">{c('Link').t`Contact us`}</a>
            </Row>
            {needUpsell && (
                <>
                    <Row className="rounded p-2 bg-info">
                        <div className="shrink-0">
                            <Icon name="info-circle" />
                        </div>
                        <div className="ml-2">
                            {totalCountExceeded ? (
                                c('Info')
                                    .t`Number of dedicated servers you try to assign (${addedCount}) is more than what is still available in your plan (${remainingCount}) as you own ${ownedCount} and you already use ${usedCount}.`
                            ) : (
                                <>
                                    <div>{c('Info')
                                        .t`Some of your available servers can only be used in specific countries due to recent removals`}</div>
                                    <div className="mt-3">
                                        {c('Info')
                                            .t`You can immediately unlock the setup above by adding ${specificCountryCount} to the number of IP addresses in your plan or reach us for tailor-made solutions.`}
                                        <a href={vpnEnterpriseContactUrl} className="ml-1">{c('Link').t`Contact us`}</a>
                                    </div>
                                </>
                            )}
                        </div>
                    </Row>
                    <Row>
                        {canBuyMore && (
                            <Button
                                color="norm"
                                onClick={onUpsell}
                                title={c('Title').t`Customize the number of IP addresses in your plan`}
                            >
                                {c('Action').t`Get more servers`}
                            </Button>
                        )}
                    </Row>
                </>
            )}
            <Row className="rounded p-2 bg-weak">
                <div className="shrink-0">
                    <Icon name="info-circle" />
                </div>
                <div className="ml-2">
                    {c('Info').t`We recommend having multiple servers in different locations to provide redundancy.`}
                </div>
            </Row>
        </>
    );
};

export default GatewayCountrySelection;
