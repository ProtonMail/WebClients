import { c } from 'ttag';

import { createDomain } from '@proton/account/domains/actions';
import { Button } from '@proton/atoms/Button/Button';
import { useErrorHandler } from '@proton/components/index';
import useLoading from '@proton/hooks/useLoading';
import { IcCheckmarkCircleFilled } from '@proton/icons/icons/IcCheckmarkCircleFilled';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import type { Domain } from '@proton/shared/lib/interfaces';

import type { MigrationSetupModel } from '../../types';
import type { StepComponentProps } from './MigrationSetup';

interface Props extends StepComponentProps {
    model: MigrationSetupModel;
    domain?: Domain;
    registrar?: { name: string; url?: string };
}

const StepDomain = ({ model, domain, registrar, submitButton }: Props) => {
    const dispatch = useDispatch();
    const handleError = useErrorHandler();
    const [loading, withLoading] = useLoading();
    const handleAddDomain = () => dispatch(createDomain({ name: model.domainName! })).catch(handleError);

    return (
        <div className="max-w-custom" style={{ '--max-w-custom': '42rem' }}>
            <h3 className="text-4xl text-bold mb-2">{c('BOSS').t`Configure your domain`}</h3>

            <p className="color-weak mt-0">{c('BOSS')
                .t`We detected the primary domain linked to your Google Workspace account. Confirm it to continue setting up email for your ${BRAND_NAME} organization.`}</p>

            <div className="relative flex flex-row flex-nowrap items-center justify-space-between gap-2 border border-weak rounded-xl p-4 mt-2">
                <div>
                    <p className="text-ellipsis flex-1 m-0" title={model.domainName}>
                        {model.domainName}
                    </p>
                    <p className="m-0 text-sm color-weak">
                        {!domain && c('BOSS').t`Not confirmed`}
                        {domain && registrar && c('BOSS').t`Managed via ${registrar.name}`}
                        {domain && !registrar && c('BOSS').t`Domain added`}
                    </p>
                </div>
                {!domain ? (
                    <Button
                        className="text-semibold shrink-0"
                        color="norm"
                        loading={loading}
                        onClick={() => withLoading(handleAddDomain())}
                    >
                        {c('BOSS').t`Add domain`}
                    </Button>
                ) : (
                    <div className="flex gap-1 text-semibold color-primary items-center">
                        <IcCheckmarkCircleFilled />
                        <span>{c('BOSS').t`Domain added`}</span>
                    </div>
                )}
            </div>
            {submitButton && <div className="mt-8 flex justify-end">{submitButton}</div>}
        </div>
    );
};

export default StepDomain;
