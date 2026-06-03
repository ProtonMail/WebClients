import type { FC } from 'react';

import { c } from 'ttag';

import { createDomain, syncDomain } from '@proton/account/domains/actions';
import { Button } from '@proton/atoms/Button/Button';
import { Option, SelectTwo, useErrorHandler, useNotifications } from '@proton/components/index';
import useLoading from '@proton/hooks/useLoading';
import { IcCheckmarkCircleFilled } from '@proton/icons/icons/IcCheckmarkCircleFilled';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import noop from '@proton/utils/noop';

import { KNOWN_REGISTRARS } from '../../domains';
import type { StepComponentProps } from './MigrationSetup';

const StepDomain: FC<StepComponentProps> = ({ model, onNext }) => {
    const dispatch = useDispatch();
    const handleError = useErrorHandler();
    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading();

    const handleAddDomain = () =>
        dispatch(createDomain({ name: model.domainName! }))
            .then((domain) => {
                createNotification({ text: c('BOSS').t`Domain added` });
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

    return (
        <div className="max-w-custom" style={{ '--max-w-custom': '42rem' }}>
            <div className="flex justify-space-between flex-nowrap items-center gap-4 mb-4">
                <h3 className="text-4xl text-bold">{c('BOSS').t`Configure your domain`}</h3>
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
            <p className="color-weak mt-0">{c('BOSS').t`Add your organization email domain to ${BRAND_NAME}.`}</p>

            <div className="relative flex flex-row flex-nowrap items-center justify-space-between gap-2 border border-weak rounded-xl p-4 mt-2 mb-8">
                <div>
                    <p className="text-ellipsis flex-1 m-0" title={model.domainName}>
                        {model.domainName}
                    </p>
                    {!model.domain && <p className="m-0 text-sm color-weak">{c('BOSS').t`Not confirmed`}</p>}
                </div>
                {!model.domain ? (
                    <Button
                        className="text-semibold shrink-0"
                        color="norm"
                        loading={loading}
                        onClick={() => withLoading(handleAddDomain())}
                    >
                        {c('BOSS').t`Add domain`}
                    </Button>
                ) : (
                    <div className="flex gap-1 text-semibold color-primary items-center py-2">
                        <IcCheckmarkCircleFilled />
                        <span>{c('BOSS').t`Domain added`}</span>
                    </div>
                )}
            </div>

            {model.domain && (
                <div>
                    <h4 className="m-0 text-lg text-semibold">{c('BOSS').t`Domain provider`}</h4>
                    <p className="mt-0 color-weak">{c('BOSS')
                        .t`Not detected correctly? Choose your provider from the list.`}</p>
                    <SelectTwo
                        className="border-weak py-8 rounded-lg"
                        value={model.domainRegistrarId ?? 0}
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
