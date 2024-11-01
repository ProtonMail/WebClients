import { type FC, useEffect, useState } from 'react';
import { useLocation, useParams } from 'react-router';

import { c } from 'ttag';

import warningIcon from '@proton/pass/assets/secure-link/secure-link-warning.svg';
import { ItemContentView } from '@proton/pass/components/Item/Containers/ItemContentView';
import { DateBadge } from '@proton/pass/components/Layout/Badge/DateBadge';
import { useRequest } from '@proton/pass/hooks/useActionRequest';
import { intoSecureLinkItemRevision } from '@proton/pass/lib/secure-links/secure-links.utils';
import { secureLinkOpen } from '@proton/pass/store/actions';
import type { Maybe, MaybeNull, SecureLinkItem } from '@proton/pass/types';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';

type SecureLinkParams = { token: string };

const SecureLinkView: FC = () => {
    const { hash } = useLocation();
    const { token } = useParams<SecureLinkParams>();
    const [response, setResponse] = useState<Maybe<SecureLinkItem>>();
    const [error, setError] = useState<MaybeNull<string>>(null);

    const { dispatch, loading } = useRequest(secureLinkOpen, {
        initial: { token, linkKey: '' },
        onStart: () => setError(null),
        onSuccess: ({ data }) => setResponse(data),
        onFailure: ({ data }) => setError(data.error),
    });

    useEffect(() => dispatch({ token, linkKey: hash.replaceAll('#', '') }), []);

    return (
        <>
            {response && (
                <>
                    <h3 className="text-bold mb-4 xs:px-8 sm:px-16 sm:mx-4 md:mx-10">
                        {c('Action').t`Someone shared an item with you on ${PASS_APP_NAME}.`}
                    </h3>

                    {response.expirationDate && <DateBadge expirationTime={response?.expirationDate} />}
                    {response.item && (
                        <ItemContentView revision={intoSecureLinkItemRevision(response)} secureLinkItem />
                    )}
                </>
            )}

            {loading && (
                <div className="flex flex-column gap-2">
                    <div className="pass-skeleton pass-skeleton--box" style={{ '--skeleton-height': '3.5rem' }} />
                    <div className="pass-skeleton pass-skeleton--box" style={{ '--skeleton-height': '3rem' }} />
                    <div className="pass-skeleton pass-skeleton--box" style={{ '--skeleton-height': '30rem' }} />
                </div>
            )}

            {error && (
                <div className="flex flex-column items-center">
                    <img src={warningIcon} alt="" />
                    <h4 className="text-bold mb-3">{error}</h4>
                    <div>{c('Error').t`Try reaching out to the link owner.`}</div>
                </div>
            )}
        </>
    );
};

export default SecureLinkView;
