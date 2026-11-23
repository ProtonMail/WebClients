import { useEffect, useRef, useState } from 'react';

import debounce from 'lodash/debounce';
import { c, msgid } from 'ttag';

import { useNotifications } from '@proton/app-context/useNotifications';
import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import { Loader } from '@proton/atoms/Loader/Loader';
import useIsMounted from '@proton/hooks/useIsMounted';
import clsx from '@proton/utils/clsx';

import SearchInput from '../../../components/input/SearchInput';
import LabelStack from '../../../components/labelStack/LabelStack';
import useModalState from '../../../components/modalTwo/useModalState';
import Pagination from '../../../components/pagination/Pagination';
import Table from '../../../components/table/Table';
import TableBody from '../../../components/table/TableBody';
import TableCell from '../../../components/table/TableCell';
import TableHeader from '../../../components/table/TableHeader';
import TableRow from '../../../components/table/TableRow';
import useErrorHandler from '../../../hooks/useErrorHandler';
import { SettingsCardActions, SettingsCardBody } from '../../account/SettingsCardSection';
import { SettingsLayoutVariant } from '../../layout/interface';
import type { HandleSpamListActionClick } from './Spams.helpers';
import { getActionsByLocation, getLabelByLocation, getNotificationByAction } from './Spams.helpers';
import type { SpamItem, SpamLocation } from './Spams.interfaces';
import SpamsButtonDropdown from './SpamsButtonDropdown';
import SpamsNav from './SpamsNav';
import useSpamApi from './hooks/useSpamApi';
import useSpamState from './hooks/useSpamState';
import DeleteSpamModal from './modals/DeleteSpamModal';
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
    /** The card variant shows the add button above a card holding the lists, and no card without lists. */
    variant?: SettingsLayoutVariant;
}

const debouncer = debounce((callback: () => void) => {
    callback();
}, 500);

const Spams = ({ isOrganization, variant = SettingsLayoutVariant.Default }: Props) => {
    const isMounted = useIsMounted();
    const [modalProps, openModal, renderModal] = useModalState();
    const [deleteModalProps, openDeleteModal, renderDeleteModal] = useModalState();
    const [itemToDelete, setItemToDelete] = useState<SpamItem>();

    const { createNotification } = useNotifications();

    const { fetchSpams, insertSpam, updateSpam, deleteSpam } = useSpamApi(isOrganization);
    const errorHandler = useErrorHandler();
    const abortFetchSpams = useRef(new AbortController());
    const [{ status, list, globalTotal, total, search, display, modal, page }, dispatch] = useSpamState((nextState) => {
        abortFetchSpams.current?.abort();
        abortFetchSpams.current = new AbortController();

        debouncer(() => {
            const abortController = abortFetchSpams.current;
            fetchSpams(nextState.display, nextState.search, nextState.page - 1, ELEMENTS_PER_PAGE, abortController)
                .then((result) => {
                    if (isMounted()) {
                        dispatch({ type: 'setList', payload: result });
                    }
                })
                .catch((e) => {
                    // An aborted request was replaced by a newer one, which owns the loading state
                    if (abortController.signal.aborted || !isMounted()) {
                        return;
                    }
                    errorHandler(e);
                    // Leave the loading state, so the previous rows are usable again
                    dispatch({ type: 'loading', payload: false });
                });
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

    // Deleting asks for confirmation first, the other actions apply right away
    const handleActionClick: HandleSpamListActionClick = (action, item) => {
        if (action === 'delete') {
            setItemToDelete(item);
            openDeleteModal(true);
            return;
        }
        handleMoveSpam(action, item);
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

    const resultsCount = list.length;
    const isLoading = status === 'loading';
    // Rows from the previous list stay visible under an overlay while the next one loads
    const hasRows = list.length > 0 && status !== 'noResults';

    const isCard = variant === SettingsLayoutVariant.Card;

    const addButton = (
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
    );

    const listContent = (
        <>
            {globalTotal > 0 && (
                <>
                    <div className="mb-4 spam-search-input">
                        <SearchInput
                            onChange={(nextSearch) => {
                                if (nextSearch !== search) {
                                    dispatch({ type: 'setSearch', payload: nextSearch });
                                }
                            }}
                            placeholder={c('FilterSettings').t`Search list`}
                        />
                    </div>
                    <span className="sr-only" aria-atomic aria-live="assertive">
                        {c('Info').ngettext(
                            msgid`${resultsCount} result found`,
                            `${resultsCount} results found`,
                            resultsCount
                        )}
                    </span>

                    <SpamsNav
                        selected={display}
                        onChange={(nextDisplay) => dispatch({ type: 'setDisplay', payload: nextDisplay })}
                    />
                </>
            )}

            {isLoading && !hasRows && <Loader size="large" />}

            {hasRows && (
                <div className="relative" aria-busy={isLoading}>
                    <Table
                        hasActions
                        responsive="cards"
                        className={clsx(isLoading && 'opacity-50 pointer-events-none')}
                    >
                        <TableHeader>
                            <tr>
                                <TableCell type="header">{c('TableHeader').t`Email address or domain`}</TableCell>
                                <TableCell type="header">{c('TableHeader').t`List`}</TableCell>
                                <TableCell type="header">
                                    <span className="sr-only">{c('TableHeader').t`Action`}</span>
                                </TableCell>
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
                                            title={c('Action').t`Edit`}
                                            actions={getActionsByLocation(item, handleActionClick)}
                                            buttonProps={{ size: 'small', disabled: isLoading }}
                                        />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    {isLoading && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <CircleLoader size="medium" />
                        </div>
                    )}
                </div>
            )}
            {/* Pagination renders nothing for a single page: skip the wrapper so the table stays last */}
            {total > ELEMENTS_PER_PAGE && (
                <div className="text-center mt-4">
                    <Pagination
                        total={total}
                        page={page}
                        limit={ELEMENTS_PER_PAGE}
                        disabled={isLoading}
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
            )}
        </>
    );

    const deleteModal = renderDeleteModal && itemToDelete && (
        <DeleteSpamModal
            {...deleteModalProps}
            item={itemToDelete}
            onDelete={() => handleMoveSpam('delete', itemToDelete)}
        />
    );

    if (isCard) {
        return (
            <>
                <SettingsCardActions>{addButton}</SettingsCardActions>
                {/* The card only shows once there are lists; until then the loader sits under the button */}
                {globalTotal > 0 ? (
                    <SettingsCardBody>{listContent}</SettingsCardBody>
                ) : (
                    'loading' === status && <Loader size="large" />
                )}
                {renderModal && modal && <SpamModal modalProps={modalProps} type={modal} onAdd={handleInsertSpam} />}
                {deleteModal}
            </>
        );
    }

    return (
        <>
            <div className="mb-8 spam-add-address">{addButton}</div>
            {listContent}
            {renderModal && modal && <SpamModal modalProps={modalProps} type={modal} onAdd={handleInsertSpam} />}
            {deleteModal}
        </>
    );
};

export default Spams;
