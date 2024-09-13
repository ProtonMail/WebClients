import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { c } from 'ttag';

import { CircleLoader } from '@proton/atoms';
import { GenericError, useApi, useErrorHandler } from '@proton/components';
import { useLoading } from '@proton/hooks';
// import type { ExternalForwardingResult } from '@proton/shared/lib/api/forwardings';
import { acceptExternalGroupMembership, declineExternalGroupMembership } from '@proton/shared/lib/api/groups';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
// import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';

import PublicFooter from '../components/PublicFooter';
import PublicLayout from '../components/PublicLayout';
import ExpiredError from './ExpiredError';
import accountIllustration from './account-illustration.svg';

enum ErrorType {
    Expired,
    API,
}

export enum GroupInviteRequest {
    Accept = 'accept',
    Decline = 'decline',
}

interface Props {
    request: GroupInviteRequest;
}

const getHeader = (request: GroupInviteRequest) => {
    if (request === 'accept') {
        return c('group_invite_2024: Title').t`Group invitation accepted`;
    }

    if (request === 'decline') {
        return c('group_invite_2024: Title').t`Group invitation declined`;
    }

    return '';
};

const getMain = (request: GroupInviteRequest) => {
    if (request === 'accept') {
        return (
            <>
                <div className="text-center">{c('group_invite_2024: Info').t`You can safely close this tab.`}</div>
            </>
        );
    }

    if (request === 'decline') {
        return (
            <>
                <div className="text-center mb-3">
                    {c('group_invite_2024: Info')
                        .jt`You have declined the group invitation and will not receive any email from this group.`}
                </div>
                <div className="text-center">{c('group_invite_2024: Info').t`You can safely close this tab.`}</div>
            </>
        );
    }

    return null;
};

const GroupInviteContainer = ({ request }: Props) => {
    const api = useApi();
    const handleError = useErrorHandler();
    const [error, setError] = useState<{ type: ErrorType } | null>(null);
    const [loading, withLoading] = useLoading(true);
    // const silentApi = getSilentApi(api);
    const location = useLocation();
    const header = getHeader(request);
    // const [groupEmail, setGroupEmail] = useState<string>('');
    const main = getMain(request);

    useEffect(() => {
        const jwt = location.hash.replace('#', '');

        const promise = async () => {
            try {
                // const { ForwarderEmail } = await silentApi<ExternalForwardingResult>(getExternalForwarding(jwt));
                // setGroupEmail(ForwarderEmail);
                if (request === GroupInviteRequest.Accept) {
                    await api(acceptExternalGroupMembership(jwt));
                }
                if (request === GroupInviteRequest.Decline) {
                    await api(declineExternalGroupMembership(jwt));
                }
            } catch (error) {
                const { code } = getApiError(error);
                if (code === API_CUSTOM_ERROR_CODES.JWT_EXPIRED) {
                    setError({ type: ErrorType.Expired });
                } else {
                    handleError(error);
                    setError({ type: ErrorType.API });
                }
            }
        };

        void withLoading(promise);
    }, []);

    return (
        <main className="main-area h-full">
            {(() => {
                if (error) {
                    if (error.type === ErrorType.Expired) {
                        return (
                            <div className="absolute inset-center">
                                <ExpiredError type="group" />
                            </div>
                        );
                    }
                    return (
                        <div className="absolute inset-center">
                            <GenericError className="text-center">
                                {c('group_invite_2024: Error message, recovery').t`Please try opening the link again.`}
                            </GenericError>
                        </div>
                    );
                }
                if (loading) {
                    return (
                        <div className="absolute inset-center text-center">
                            <CircleLoader size="large" />
                        </div>
                    );
                }
                return (
                    <PublicLayout
                        className="h-full"
                        img={<img src={accountIllustration} alt="" />}
                        header={header}
                        main={main}
                        below={<PublicFooter />}
                    />
                );
            })()}
        </main>
    );
};

export default GroupInviteContainer;
