import { type FC, useEffect, useState } from 'react';
import { useLocation, useParams } from 'react-router';

import { c } from 'ttag';

import { PASS_APP_NAME } from '@proton/shared/lib/constants';

import warningIcon from '../../assets/secure-link/secure-link-warning.svg';
import { useRequest } from '../../hooks/useRequest';
import { intoSecureLinkItemRevision } from '../../lib/secure-links/secure-links.utils';
import { secureLinkOpen } from '../../store/actions';
import type { Maybe, MaybeNull, SecureLinkItem } from '../../types';
import { ItemContentView } from '../Item/Containers/ItemContentView';
import { DateBadge } from '../Layout/Badge/DateBadge';
import { SecureLinkFilesList } from './SecureLinkFilesList';

type SecureLinkParams = { token: string };

const SecureLinkView: FC = () => {
    const { hash } = useLocation();
    const { token } = useParams<SecureLinkParams>();
    const [response, setResponse] = useState<Maybe<SecureLinkItem>>();
    const [error, setError] = useState<MaybeNull<string>>(null);

    const { dispatch, loading } = useRequest(secureLinkOpen, {
        initial: { token, linkKey: '' },
        onStart: () => setError(null),
        onSuccess: setResponse,
        onFailure: (error) => setError(error),
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
                        <ItemContentView revision={intoSecureLinkItemRevision(response)}>
                            {response.files && (
                                <SecureLinkFilesList files={response.files.content} filesToken={response.files.token} />
                            )}
                        </ItemContentView>
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
