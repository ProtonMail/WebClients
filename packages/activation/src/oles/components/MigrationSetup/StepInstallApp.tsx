import type { FC } from 'react';

import { c } from 'ttag';

import { Banner } from '@proton/atoms/Banner/Banner';
import { Button } from '@proton/atoms/Button/Button';
import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { Href } from '@proton/atoms/Href/Href';
import { IcArrowRotateRight } from '@proton/icons/icons/IcArrowRotateRight';
import { IcCheckmarkCircleFilled } from '@proton/icons/icons/IcCheckmarkCircleFilled';
import { GSUITE_MARKETPLACE_URL } from '@proton/shared/lib/api/activation';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import protonGoogleIcon from '@proton/styles/assets/img/migration-assistant/proton-google.svg';

import type { MigrationSetupModel } from '../../types';
import { useConnectionState } from '../../useConnectionState';

const StepInstallApp: FC<{ model: MigrationSetupModel }> = () => {
    const [connection, loading, verify] = useConnectionState();

    return (
        <div className="max-w-custom" style={{ '--max-w-custom': '42rem' }}>
            <p className="text-xl text-bold mb-2">{c('BOSS').t`Install migration app`}</p>
            <p className="color-weak mt-0">
                {c('BOSS')
                    .t`To migrate your organization’s data, you need to install the ${BRAND_NAME} Migration Assistant app from the Google Workspace Marketplace. This will grant permission to ${BRAND_NAME} to copy your data. After installing it, come back here to continue.`}{' '}
                <Href href="#">{c('Link').t`Learn more`}</Href>
            </p>
            <div className="flex border border-weak rounded justify-space-between p-4 items-center mb-8">
                <div className="flex gap-2 items-center">
                    <img src={protonGoogleIcon} alt="" className="shrink-0" width={48} />
                    <div>
                        <p className="m-0 text-semibold">{c('BOSS').t`${BRAND_NAME} Migration Assistant`}</p>
                        <p className="m-0 text-sm color-weak">{c('BOSS')
                            .t`Google Marketplace app to copy data to ${BRAND_NAME}`}</p>
                    </div>
                </div>
                <div className="flex items-center justify-end gap-2">
                    {connection !== 'connected' && (
                        <>
                            <ButtonLike as="a" href={GSUITE_MARKETPLACE_URL} target="_blank">{c('BOSS')
                                .t`Install app`}</ButtonLike>
                            <Button color="norm" onClick={verify} disabled={loading}>
                                <IcArrowRotateRight />
                                <span className="ml-2">{c('BOSS').t`Verify installation`}</span>
                            </Button>
                        </>
                    )}
                    {connection === 'connected' && (
                        <div className="flex gap-1 text-semibold color-primary items-center">
                            <IcCheckmarkCircleFilled />
                            <span>{c('BOSS').t`App installed`}</span>
                        </div>
                    )}
                </div>
            </div>
            {connection === 'disconnected' && (
                <Banner variant="warning">
                    {c('BOSS')
                        .t`We were unable to verify the installation, please check that you have installed it in your Google Workspace account and try again.`}
                </Banner>
            )}
        </div>
    );
};

export default StepInstallApp;
