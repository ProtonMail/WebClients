import { useEffect, useRef } from 'react';

import { c } from 'ttag';

import { LabelStack, Pagination } from '@proton/components/components';
import SearchInput from '@proton/components/components/input/SearchInput';
import Loader from '@proton/components/components/loader/Loader';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import Table from '@proton/components/components/table/Table';
import TableBody from '@proton/components/components/table/TableBody';
import TableCell from '@proton/components/components/table/TableCell';
import TableHeader from '@proton/components/components/table/TableHeader';
import TableRow from '@proton/components/components/table/TableRow';
import { useErrorHandler, useNotifications } from '@proton/components/hooks';
import useIsMounted from '@proton/hooks/useIsMounted';

import type { HandleSpamListActionClick } from './Spams.helpers';
import { getActionsByLocation, getLabelByLocation, getNotificationByAction } from './Spams.helpers';
import type { SpamLocation } from './Spams.interfaces';
import SpamsButtonDropdown from './SpamsButtonDropdown';
import SpamsNav from './SpamsNav';
import useSpamApi from './hooks/useSpamApi';
import useSpamState from './hooks/useSpamState';
import type { SpamMode } from './modals/SpamModal';
import SpamModal from './modals/SpamModal';

const getActions = (): { type: SpamLocation; getName: () => string }[] => {
    return [
        { type: 'SPAM', getName: () => c('Action').t`Spam` },
        { type: 'BLOCKED', getName: () => c('Action').t`Block` },
        { type: 'NON_SPAM', getName: () => c('Action').t`Allow` },
    ] as { type: SpamLocation; getName: () => string }[];
};

const ELEMENTS_PER_PAGE = 10;

interface Props {
    isOrganization?: boolean;
}

const Spams = ({ isOrganization }: Props) => {
    const isMounted = useIsMounted();
    const [modalProps, openModal, renderModal] = useModalState();

    const { createNotification } = useNotifications();

    const { fetchSpams, insertSpam, updateSpam, deleteSpam } = useSpamApi(isOrganization);
    const errorHandler = useErrorHandler();
    const abortFetchSpams = useRef(new AbortController());
    const [{ status, list, globalTotal, total, search, display, modal, page }, dispatch] = useSpamState((nextState) => {
        abortFetchSpams.current?.abort();
        abortFetchSpams.current = new AbortController();

        void fetchSpams(
            nextState.display,
            nextState.search,
            nextState.page - 1,
            ELEMENTS_PER_PAGE,
            abortFetchSpams.current
        ).then((result) => {
            if (isMounted()) {
                dispatch({ type: 'setList', payload: result });
            }
        });
    });

    const handleMoveSpam: HandleSpamListActionClick = (action, item) => {
        const actionApiCall = (() => {
            switch (action) {
                case 'block':
                    return () => updateSpam(item.id, 'BLOCKED');
                case 'delete':
                    return () => deleteSpam(item.id);
                case 'spam':
                    return () => updateSpam(item.id, 'SPAM');
                case 'unspam':
                    return () => updateSpam(item.id, 'NON_SPAM');
                default:
                    throw new Error('Action does not exist');
            }
        })();

        dispatch({ type: 'loading', payload: true });

        actionApiCall()
            .then(() => {
                dispatch({ type: 'refetchList' });
                createNotification({
                    text: getNotificationByAction(action, 'success', item),
                    type: 'success',
                });
            })
            .catch((e) => {
                errorHandler(e);
                createNotification({
                    text: getNotificationByAction(action, 'fail', item),
                    type: 'error',
                });
                dispatch({ type: 'loading', payload: false });
            });
    };

    const handleInsertSpam = async (type: SpamMode, name: string) => {
        if (!modal) {
            return;
        }

        await insertSpam(modal, type, name);

        if (!isMounted()) {
            return;
        }

        dispatch({ type: 'refetchList' });

        createNotification({
            text:
                type === 'email'
                    ? c('Email spam notification').t`${name} added`
                    : c('Domain spam notification').t`${name} added`,
            type: 'success',
        });
    };

    useEffect(() => {
        dispatch({ type: 'fetchList' });
    }, []);

    return (
        <>
            <div className="mb-8 spam-add-address">
                <SpamsButtonDropdown
                    title={c('Action').t`Add address or domain`}
                    actions={getActions().map(({ getName, type }) => ({
                        name: getName(),
                        onClick: () => {
                            dispatch({ type: 'setModal', payload: type });
                            openModal(true);
                        },
                    }))}
                    buttonProps={{
                        hasCaret: true,
                        color: 'norm',
                    }}
                />
            </div>

            {globalTotal > 0 && (
                <>
                    <div className="mb-8 spam-search-input">
                        <SearchInput
                            onChange={(nextSearch) => {
                                if (nextSearch !== search) {
                                    dispatch({ type: 'setSearch', payload: nextSearch });
                                }
                            }}
                            placeholder={c('FilterSettings').t`Search list`}
                        />
                    </div>

                    <SpamsNav
                        selected={display}
                        onChange={(nextDisplay) => dispatch({ type: 'setDisplay', payload: nextDisplay })}
                    />
                </>
            )}

            {'loading' === status && <Loader size="large" />}

            {'displayResults' === status && (
                <>
                    <Table hasActions responsive="cards">
                        <TableHeader>
                            <tr>
                                <TableCell type="header">{c('TableHeader').t`Email address or domain`}</TableCell>
                                <TableCell type="header">{c('TableHeader').t`List`}</TableCell>
                                <TableCell type="header">{c('TableHeader').t`Edit`}</TableCell>
                            </tr>
                        </TableHeader>
                        <TableBody>
                            {list.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell>
                                        <span
                                            className="text-ellipsis inline-block max-w-full align-bottom"
                                            title={'domain' in item ? item.domain : item.email}
                                        >
                                            {'domain' in item ? item.domain : item.email}
                                        </span>
                                    </TableCell>
                                    <TableCell label={c('TableHeader').t`Marked as`}>
                                        <LabelStack labels={[getLabelByLocation(item.location)]} />
                                    </TableCell>
                                    <TableCell>
                                        <SpamsButtonDropdown
                                            title="…"
                                            actions={getActionsByLocation(item, handleMoveSpam)}
                                        />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </>
            )}
            <div className="text-center">
                <Pagination
                    total={total}
                    page={page}
                    limit={ELEMENTS_PER_PAGE}
                    onSelect={(page) => {
                        dispatch({ type: 'setPage', payload: page });
                    }}
                    onNext={() => {
                        dispatch({ type: 'setPage', payload: page + 1 });
                    }}
                    onPrevious={() => {
                        dispatch({ type: 'setPage', payload: page - 1 });
                    }}
                />
            </div>

            {renderModal && modal && <SpamModal modalProps={modalProps} type={modal} onAdd={handleInsertSpam} />}
        </>
    );
};

export default Spams;
