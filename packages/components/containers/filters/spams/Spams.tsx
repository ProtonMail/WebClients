import { useEffect, useRef } from 'react';

import { c } from 'ttag';

import {
    Button,
    LabelStack,
    Loader,
    Pagination,
    SearchInput,
    Table,
    TableBody,
    TableCell,
    TableHeader,
    TableRow,
    useModalState,
} from '@proton/components/components';
import { useErrorHandler, useFeature, useNotifications } from '@proton/components/hooks';
import useIsMounted from '@proton/hooks/useIsMounted';

import { FeatureCode } from '../../features';
import {
    HandleSpamListActionClick,
    getActionsByLocation,
    getLabelByLocation,
    getNotificationByAction,
} from './Spams.helpers';
import { SpamLocation } from './Spams.interfaces';
import SpamsButtonDropdown from './SpamsButtonDropdown';
import SpamsNav from './SpamsNav';
import useSpamApi from './hooks/useSpamApi';
import useSpamState from './hooks/useSpamState';
import SpamModal, { SpamMode } from './modals/SpamModal';

const INSERT_ACTIONS: { type: SpamLocation; getName: () => string }[] = [
    { type: 'BLOCKED', getName: () => c('Action').t`Block` },
    { type: 'SPAM', getName: () => c('Action').t`Spam` },
    { type: 'NON_SPAM', getName: () => c('Action').t`Non spam` },
];

const ELEMENTS_PER_PAGE = 10;

const Spams = () => {
    const isMounted = useIsMounted();
    const [modalProps, openModal, renderModal] = useModalState();
    const { feature: blockSenderFeature, loading: blockSenderLoading } = useFeature(FeatureCode.BlockSender);

    const { createNotification } = useNotifications();

    const { fetchSpams, insertSpam, updateSpam, deleteSpam } = useSpamApi();
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
            text: c('Spam notification').t`${name} added`,
            type: 'success',
        });
    };

    useEffect(() => {
        dispatch({ type: 'fetchList' });
    }, []);

    return blockSenderLoading ? null : (
        <>
            {blockSenderFeature?.Value === true ? (
                <div className="mb2">
                    <SpamsButtonDropdown
                        title={c('Action').t`Add address`}
                        actions={INSERT_ACTIONS.map(({ getName, type }) => ({
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
            ) : (
                <div className="mb2">
                    <Button
                        color="norm"
                        onClick={() => {
                            dispatch({ type: 'setModal', payload: INSERT_ACTIONS[1].type });
                            openModal(true);
                        }}
                    >
                        {c('Action').t`Add address`}
                    </Button>
                </div>
            )}

            {globalTotal > 0 && (
                <>
                    <div className="mb2">
                        <SearchInput
                            onChange={(nextSearch) => {
                                if (nextSearch !== search) {
                                    dispatch({ type: 'setSearch', payload: nextSearch });
                                }
                            }}
                            placeholder={c('FilterSettings').t`Search in Allow List and Block List`}
                        />
                    </div>

                    <SpamsNav
                        selected={display}
                        onChange={(nextDisplay) => dispatch({ type: 'setDisplay', payload: nextDisplay })}
                        showBlockSender={blockSenderFeature?.Value === true}
                    />
                </>
            )}

            {'loading' === status && <Loader size="large" />}

            {'displayResults' === status && (
                <>
                    <Table>
                        <TableHeader>
                            <tr>
                                <TableCell type="header">{c('TableHeader').t`Email address`}</TableCell>
                                <TableCell type="header">{c('TableHeader').t`Marked as`}</TableCell>
                                <TableCell type="header" className="text-right">{c('TableHeader').t`Edit`}</TableCell>
                            </tr>
                        </TableHeader>
                        <TableBody>
                            {list.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell>{'domain' in item ? item.domain : item.email}</TableCell>
                                    <TableCell>
                                        <LabelStack labels={[getLabelByLocation(item.location)]} />
                                    </TableCell>
                                    <TableCell className="text-right">
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
