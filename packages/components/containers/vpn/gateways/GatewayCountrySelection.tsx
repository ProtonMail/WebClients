import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms';
import { Field, Icon, Label, Option, Row, SelectTwo } from '@proton/components/components';
import { SelectChangeEvent } from '@proton/components/components/selectTwo/select';
import { vpnEnterpriseContactUrl } from '@proton/components/containers/payments/subscription/helpers';
import { getLocalizedCountryByAbbr } from '@proton/components/helpers/countries';
import { MAX_IPS_ADDON } from '@proton/shared/lib/constants';

import { ButtonNumberInput } from './ButtonNumberInput';
import { GatewayDto } from './GatewayDto';
import { getCountryFlagAndName } from './getCountryFlagAndName';

interface Props {
    singleServer: boolean;
    countries: readonly string[];
    ownedCount: number;
    usedCount: number;
    addedCount: number;
    language: string | readonly string[];
    onUpsell: () => void;
    specificCountryCount: number;
    loading?: boolean;
    needUpsell: boolean;
    model: GatewayDto;
    changeModel: <V extends GatewayDto[K], K extends keyof GatewayDto = keyof GatewayDto>(key: K, value: V) => void;
}

export const GatewayCountrySelection = ({
    singleServer,
    countries,
    ownedCount,
    usedCount,
    addedCount,
    language,
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

    const handleCountryChange = ({ value }: SelectChangeEvent<string>) => changeModel('country', value);

    return singleServer ? (
        <Row>
            <Label htmlFor="domain">{c('Label').t`Country`}</Label>
            <Field>
                <SelectTwo value={model.country} onChange={handleCountryChange}>
                    {countries.map((country) => (
                        <Option
                            key={country}
                            value={country}
                            title={getLocalizedCountryByAbbr(country, language) || country}
                        >
                            {getCountryFlagAndName(language, country, undefined, {
                                key: country + '-country-option-image',
                            })}
                        </Option>
                    ))}
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
            {countries.map((country) => (
                <div
                    key={'country-' + country}
                    className="flex-no-min-children md:flex-nowrap items-center mb-4"
                >
                    <Label htmlFor={'country-number-' + country} className="flex-item-fluid">
                        {getCountryFlagAndName(language, country, undefined, {
                            key: country + '-country-label-image',
                        })}
                    </Label>
                    <ButtonNumberInput
                        id={'country-number-' + country}
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
                                changeModel('country', mainCountry);
                            }

                            changeModel('quantities', quantities);
                        }}
                        step={1}
                    />
                </div>
            ))}
            <Row>
                {c('Info').t`Want servers in other countries?`}
                <a href={vpnEnterpriseContactUrl} className="ml-1">{c('Link').t`Contact us`}</a>
            </Row>
            {needUpsell && (
                <>
                    <Row className="rounded p-2 bg-info">
                        <div className="flex-item-noshrink">
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
                <div className="flex-item-noshrink">
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
