import type { FC } from 'react';

import { c } from 'ttag';

import { createDomain, syncDomain } from '@proton/account/domains/actions';
import { useCustomDomains } from '@proton/account/domains/hooks';
import { useNotifications } from '@proton/app-context/useNotifications';
import { Banner } from '@proton/atoms/Banner/Banner';
import { Button } from '@proton/atoms/Button/Button';
import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import Radio from '@proton/components/components/input/Radio';
import Option from '@proton/components/components/option/Option';
import SelectTwo from '@proton/components/components/selectTwo/SelectTwo';
import useErrorHandler from '@proton/components/hooks/useErrorHandler';
import useLoading from '@proton/hooks/useLoading';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';
import noop from '@proton/utils/noop';

import { DEFAULT_REGISTRAR_ID, KNOWN_REGISTRARS, getRegistrarByIANAId } from '../../domains';
import { useProviderDomains } from '../../useProviderDomains';
import type { StepComponentProps } from './MigrationSetup';

const StepDomain: FC<StepComponentProps> = ({ model, onNext }) => {
    const dispatch = useDispatch();
    const handleError = useErrorHandler();
    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading();
    const [domainNames, domainNamesLoading, domainNamesError, refreshDomainNames] = useProviderDomains(
        model.provider.apiProvider,
        model.tokens,
        !model.importerOrganizationId
    );
    const [customDomains] = useCustomDomains();

    const isDomainLocked = Boolean(model.importerOrganizationId);
    const radioDomainNames = isDomainLocked && model.domainName ? [model.domainName] : (domainNames ?? []);
    const isDomainAdded = (domainName: string) =>
        Boolean(customDomains?.some((d) => d.DomainName.toLowerCase() === domainName.toLowerCase()));

    // Nothing to choose from: show the domain as a plain card instead of a pre-selected radio.
    const isSingleDomain = radioDomainNames.length === 1;

    const renderDomainLabel = (domainName: string) => (
        <span className="flex-1 min-w-0">
            <span className="block text-ellipsis" title={domainName}>
                {domainName}
            </span>
            <span className="block text-sm color-weak">
                {isDomainAdded(domainName)
                    ? c('Info').t`Added to ${BRAND_NAME}`
                    : c('Info').t`Not added to ${BRAND_NAME}`}
            </span>
        </span>
    );

    const handleAddDomain = () =>
        dispatch(createDomain({ name: model.domainName! }))
            .then((domain) => {
                createNotification({ text: c('Success').t`Domain added` });
                dispatch(syncDomain(domain)).catch(noop);
            })
            .catch(handleError);

    // Some registrars have multiple IANA ids, so we keep a single option per name.
    // We pick the first id for each name, but always keep the currently selected id
    // so the value stays valid in the dropdown.
    const registrarOptions = (() => {
        const byName = new Map<string, [number, { name: string; url?: string }]>();
        for (const [id, data] of KNOWN_REGISTRARS) {
            if (!byName.has(data.name) || id === model.domainRegistrarId) {
                byName.set(data.name, [id, data]);
            }
        }
        return [...byName.values()];
    })();

    const providerName = model.provider.displayName;

    const selectedRegistrarId = getRegistrarByIANAId(model.domainRegistrarId)
        ? model.domainRegistrarId
        : DEFAULT_REGISTRAR_ID;

    return (
        <div className="max-w-custom" style={{ '--max-w-custom': '42rem' }}>
            <div className="flex justify-space-between flex-nowrap items-center gap-4 mb-4">
                <h3 className="text-4xl text-bold">{c('Title').t`Configure your domain`}</h3>
                <div className="flex gap-2 shrink-0 text-semibold">
                    <Button
                        disabled={!onNext}
                        onClick={() => onNext?.()}
                        color="norm"
                        size="medium"
                        className="rounded-lg"
                    >
                        {c('Action').t`Next`}
                    </Button>
                </div>
            </div>
            <p className="color-weak mt-0">{c('Info').t`Add your organization email domain to ${BRAND_NAME}.`}</p>

            {!model.domainName && domainNamesLoading && <CircleLoader />}

            {!model.domainName && !domainNamesLoading && (domainNamesError || domainNames) && (
                <Banner
                    variant="danger"
                    opaqueVariant
                    largeRadius
                    noIcon
                    className="p-2 mt-2 mb-8"
                    action={<Button onClick={() => refreshDomainNames()}>{c('Action').t`Try again`}</Button>}
                >
                    {domainNamesError ??
                        c('Error')
                            .t`No verified domain found in your ${providerName} account. Verify your domain with ${providerName}, then try again.`}
                </Banner>
            )}

            {model.domainName && (
                <div className="flex flex-column gap-4 mt-2 mb-8">
                    {isSingleDomain ? (
                        <div className="flex flex-nowrap items-center border border-weak rounded-xl p-4">
                            {renderDomainLabel(radioDomainNames[0])}
                        </div>
                    ) : (
                        <div className="flex flex-column gap-2">
                            {radioDomainNames.map((domainName, index) => {
                                const checked = domainName === model.domainName;
                                return (
                                    <Radio
                                        key={domainName}
                                        id={`migration-domain-${index}`}
                                        name="migration-domain"
                                        checked={checked}
                                        onChange={() => model.update({ domainName })}
                                        className={clsx(
                                            'flex flex-nowrap items-center border rounded-xl p-4',
                                            checked ? 'border-primary' : 'border-weak'
                                        )}
                                    >
                                        {renderDomainLabel(domainName)}
                                    </Radio>
                                );
                            })}
                        </div>
                    )}
                    {!model.domain && (
                        <Button
                            className="text-semibold self-start"
                            color="norm"
                            loading={loading}
                            onClick={() => withLoading(handleAddDomain())}
                        >
                            {c('Action').t`Add domain`}
                        </Button>
                    )}
                </div>
            )}

            {model.domain && (
                <div>
                    <h4 className="m-0 text-lg text-semibold">{c('Title').t`Domain provider`}</h4>
                    <p className="mt-0 color-weak">{c('Info')
                        .t`Not detected correctly? Choose your provider from the list.`}</p>
                    <SelectTwo
                        className="border-weak py-8 rounded-lg"
                        value={selectedRegistrarId}
                        onChange={(e) => model.update({ domainRegistrarId: e.value })}
                    >
                        {registrarOptions.map(([id, data]) => (
                            <Option key={id} value={id} title={data.name} />
                        ))}
                    </SelectTwo>
                </div>
            )}
        </div>
    );
};

export default StepDomain;
