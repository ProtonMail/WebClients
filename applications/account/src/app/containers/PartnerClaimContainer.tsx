import { useEffect, useState } from 'react';

import { addressesThunk } from '@proton/account/addresses';
import { domainsThunk } from '@proton/account/domains';
import { syncDomain } from '@proton/account/domains/actions';
import { convertExternalAddress } from '@proton/account/organizationKey/convertAddresses';
import { StandardLoadErrorPage, useApi, useErrorHandler, useKTVerifier } from '@proton/components';
import useAuthentication from '@proton/components/hooks/useAuthentication';
import { useDispatch } from '@proton/redux-shared-store';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { claimOrphanDomain } from '@proton/shared/lib/api/partner';
import { getAppHref } from '@proton/shared/lib/apps/helper';
import { ADDRESS_TYPE, APPS } from '@proton/shared/lib/constants';
import { getEmailParts } from '@proton/shared/lib/helpers/email';
import { getNonEmptyErrorMessage } from '@proton/shared/lib/helpers/error';
import noop from '@proton/utils/noop';

import AccountLoaderPage from '../content/AccountLoaderPage';

const PartnerClaimContainer = () => {
    const api = useApi();
    const silentApi = getSilentApi(api);
    const dispatch = useDispatch();
    const errorHandler = useErrorHandler();
    const createKtVerifier = useKTVerifier();
    const [error, setError] = useState<{ message?: string } | null>(null);
    const authentication = useAuthentication();

    useEffect(() => {
        const run = async () => {
            const params = new URLSearchParams(window.location.search);

            const Token = params.get('token') || '';
            const Email = params.get('email') || '';

            await silentApi(claimOrphanDomain({ Token })).catch(noop);

            const addresses = await dispatch(addressesThunk());
            const address = addresses.find((address) => address.Email === Email);
            if (!address) {
                throw new Error('Address not found');
            }

            // re-verify the domain async
            // sync domain not only returns the domain; but does a DNS query to check if DNS records are ok
            const reverifyDomain = async () => {
                const domains = await dispatch(domainsThunk());
                const [, domainPart] = getEmailParts(address.Email);
                const domain = domains.find((domain) => domain.DomainName === domainPart);
                if (domain) {
                    await dispatch(syncDomain(domain));
                }
            };

            reverifyDomain().catch(noop);

            const { keyTransparencyVerify, keyTransparencyCommit } = await createKtVerifier();
            if (address.Type === ADDRESS_TYPE.TYPE_EXTERNAL) {
                await dispatch(
                    convertExternalAddress({
                        externalAddress: address,
                        keyTransparencyVerify,
                        keyTransparencyCommit,
                    })
                );
            } else {
                // already converted probably?
            }
            window.location.href = getAppHref('/inbox?partner=true', APPS.PROTONMAIL, authentication.localID);
        };

        run().catch((error) => {
            errorHandler(error);
            setError({
                message: getNonEmptyErrorMessage(error),
            });
        });
    }, []);

    if (error) {
        return <StandardLoadErrorPage errorMessage={error.message} />;
    }

    return <AccountLoaderPage />;
};

export default PartnerClaimContainer;
