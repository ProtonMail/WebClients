import { type FC, Fragment, type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';

import { c, msgid } from 'ttag';

import type { IconComponent } from '@proton/icons/component';
import { IcChevronDownFilled } from '@proton/icons/icons/IcChevronDownFilled';
import { IcChevronRightFilled } from '@proton/icons/icons/IcChevronRightFilled';
import { IcKey } from '@proton/icons/icons/IcKey';
import { IcPassShield } from '@proton/icons/icons/IcPassShield';
import { IcPassShieldFillDanger } from '@proton/icons/icons/IcPassShieldFillDanger';
import { IcPassShieldWarning } from '@proton/icons/icons/IcPassShieldWarning';
import { IcShieldExclamationFilled } from '@proton/icons/icons/IcShieldExclamationFilled';
import clsx from '@proton/utils/clsx';

import { useItemState } from '../../../hooks/items/useItemState';
import { useOptionalItemMonitorChecks } from '../../../hooks/monitor/ItemMonitorChecksContext';
import { useItemMonitorChecks, useVisibleItemMonitorChecks } from '../../../hooks/monitor/useItemMonitorChecks';
import { useMemoSelector } from '../../../hooks/useMemoSelector';
import { MonitorCheckType } from '../../../lib/monitor/types';
import { ignoreMonitorCheck, restoreMonitorCheck } from '../../../store/actions/creators/monitor';
import type { ShareItem } from '../../../store/reducers';
import { selectSelectedItems } from '../../../store/selectors/items';
import type { ItemRevision, SelectedItem } from '../../../types/data/items';
import { useOnline } from '../../Core/ConnectivityProvider';
import { useSelectItem } from '../../Navigation/NavigationActions';
import { useItemScope } from '../../Navigation/NavigationMatches';
import { ItemChecksDuplicateList } from './ItemChecksDuplicateList';

import './ItemChecks.scss';

type CheckContent = {
    checkClass: 'weak' | 'compromised' | 'reused' | 'missing-2fa';
    subtitle: string;
    title: string;
};

const getCheckContent = (checkType: MonitorCheckType): CheckContent => {
    switch (checkType) {
        case MonitorCheckType.WEAK:
            return {
                checkClass: 'weak',
                title: c('Title').t`Weak password`,
                subtitle: c('Description').t`This account is vulnerable, visit the service and change your password.`,
            };
        case MonitorCheckType.REUSED:
            return {
                checkClass: 'reused',
                title: c('Title').t`Reused password`,
                subtitle: c('Description').t`This login uses the same password as another item.`,
            };
        case MonitorCheckType.COMPROMISED:
            return {
                checkClass: 'compromised',
                title: c('Title').t`Compromised password`,
                subtitle: c('Description')
                    .t`This login password appears in a data breach. Please visit the service and change the password.`,
            };
        case MonitorCheckType.MISSING_2FA:
            return {
                checkClass: 'missing-2fa',
                title: c('Title').t`Set up 2FA for more security`,
                subtitle: c('Description').t`This service offers 2FA. Enable it for added account security.`,
            };
    }
};

const getCollapsedCheckTitle = (checkType: MonitorCheckType): string => {
    if (checkType === MonitorCheckType.MISSING_2FA) {
        return c('Title').t`Missing 2FA`;
    }

    return getCheckContent(checkType).title;
};

const CHECK_ICONS: Record<MonitorCheckType, IconComponent> = {
    [MonitorCheckType.WEAK]: IcPassShieldFillDanger,
    [MonitorCheckType.COMPROMISED]: IcShieldExclamationFilled,
    [MonitorCheckType.REUSED]: IcKey,
    [MonitorCheckType.MISSING_2FA]: IcPassShield,
};

type ItemCheckActionProps = {
    excludedView: boolean;
    onClick: () => void;
};

const ItemCheckAction: FC<ItemCheckActionProps> = ({ excludedView, onClick }) => (
    <button type="button" className="pass-item-checks-action" onClick={onClick}>
        {excludedView ? c('Action').t`Restore` : c('Action').t`Ignore`}
    </button>
);

type ItemCheckRowProps = {
    action?: ReactNode;
    checkClass: CheckContent['checkClass'];
    description: ReactNode;
    icon: IconComponent;
    title: ReactNode;
};

const ItemCheckRow: FC<ItemCheckRowProps> = ({ action, checkClass, description, icon: CheckIcon, title }) => (
    <div className="pass-item-checks-row">
        <div className={clsx('pass-item-checks-icon', `pass-item-checks-icon--${checkClass}`)}>
            <CheckIcon size={4} />
        </div>
        <div className="pass-item-checks-main">
            <div className="pass-item-checks-content">
                <div className={clsx('pass-item-checks-heading', `pass-item-checks-heading--${checkClass}`)}>
                    {title}
                </div>
                <div className="pass-item-checks-description">{description}</div>
            </div>
            {action}
        </div>
    </div>
);

type ItemCheckCardProps = SelectedItem & {
    checkType: MonitorCheckType;
    excludedView: boolean;
    revision: ItemRevision;
    showPerCheckActions: boolean;
};

const ItemCheckCard: FC<ItemCheckCardProps> = ({
    checkType,
    excludedView,
    revision,
    shareId,
    itemId,
    showPerCheckActions,
}) => {
    const dispatch = useDispatch();
    const { checkClass, subtitle, title } = getCheckContent(checkType);

    const onAction = useCallback(() => {
        const payload = { shareId, itemId, checkType };
        dispatch(excludedView ? restoreMonitorCheck({ ...payload, revision }) : ignoreMonitorCheck(payload));
    }, [checkType, dispatch, excludedView, itemId, revision, shareId]);

    return (
        <ItemCheckRow
            action={
                showPerCheckActions ? <ItemCheckAction excludedView={excludedView} onClick={onAction} /> : undefined
            }
            checkClass={checkClass}
            description={subtitle}
            icon={CHECK_ICONS[checkType]}
            title={title}
        />
    );
};

type DuplicatePasswordCheckCardProps = SelectedItem & {
    duplicateMatches: SelectedItem[];
    excludedView: boolean;
    revision: ItemRevision;
    showPerCheckActions: boolean;
};

const DuplicatePasswordCheckCard: FC<DuplicatePasswordCheckCardProps> = ({
    duplicateMatches,
    excludedView,
    revision,
    shareId,
    itemId,
    showPerCheckActions,
}) => {
    const dispatch = useDispatch();
    const selectItem = useSelectItem();
    const others = useMemoSelector(selectSelectedItems, [duplicateMatches]);
    const total = others.length;

    const onAction = useCallback(() => {
        dispatch(
            excludedView
                ? restoreMonitorCheck({ shareId, itemId, checkType: MonitorCheckType.REUSED, revision })
                : ignoreMonitorCheck({ shareId, itemId, checkType: MonitorCheckType.REUSED })
        );
    }, [dispatch, excludedView, itemId, revision, shareId]);

    const handleItemClick = useCallback((item: ItemRevision) => selectItem(item.shareId, item.itemId), [selectItem]);

    const reusedContent = getCheckContent(MonitorCheckType.REUSED);
    const { checkClass, subtitle } = reusedContent;

    const description = useMemo(() => {
        if (excludedView) return subtitle;

        const duplicateTitle = c('Description').ngettext(
            msgid`${total} other login uses the same password`,
            `${total} other logins use the same password`,
            total
        );

        return (
            <>
                <div>{duplicateTitle}</div>
                {total > 0 && <ItemChecksDuplicateList items={others} onItemClick={handleItemClick} />}
            </>
        );
    }, [excludedView, handleItemClick, others, subtitle, total]);

    return (
        <ItemCheckRow
            action={
                showPerCheckActions ? <ItemCheckAction excludedView={excludedView} onClick={onAction} /> : undefined
            }
            checkClass={checkClass}
            description={description}
            icon={CHECK_ICONS[MonitorCheckType.REUSED]}
            title={excludedView ? reusedContent.title : c('Title').t`Reused password`}
        />
    );
};

type ItemChecksProps = {
    revision: ItemRevision;
    share: ShareItem;
};

export const ItemChecks: FC<ItemChecksProps> = ({ revision, share }) => {
    const scope = useItemScope();
    const excludedView = scope === 'monitor/excluded';
    const { canUpdateMonitorFlags } = useItemState(revision, share);
    const online = useOnline();
    const showPerCheckActions = canUpdateMonitorFlags && online;
    const sharedChecks = useOptionalItemMonitorChecks();
    const localChecks = useItemMonitorChecks(revision, sharedChecks === null);
    const checks = sharedChecks ?? localChecks;
    const visibleChecks = useVisibleItemMonitorChecks(revision, excludedView, checks);
    const multipleChecks = visibleChecks.length > 1;
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
        setExpanded(false);
    }, [revision.itemId, revision.shareId]);

    const toggleExpanded = useCallback(() => setExpanded((value) => !value), []);

    const expandFromCollapsed = useCallback(() => setExpanded(true), []);

    const cards = useMemo(
        () =>
            visibleChecks.map((checkType) => {
                if (checkType === MonitorCheckType.REUSED) {
                    return (
                        <DuplicatePasswordCheckCard
                            key={checkType}
                            showPerCheckActions={showPerCheckActions}
                            duplicateMatches={checks.duplicateMatches}
                            excludedView={excludedView}
                            revision={revision}
                            shareId={revision.shareId}
                            itemId={revision.itemId}
                        />
                    );
                }

                return (
                    <ItemCheckCard
                        key={checkType}
                        showPerCheckActions={showPerCheckActions}
                        checkType={checkType}
                        excludedView={excludedView}
                        revision={revision}
                        shareId={revision.shareId}
                        itemId={revision.itemId}
                    />
                );
            }),
        [checks.duplicateMatches, excludedView, revision, showPerCheckActions, visibleChecks]
    );

    if (checks.loading || cards.length === 0) return null;

    const showCollapsed = multipleChecks && !expanded;

    const renderChecks = () => {
        if (showCollapsed) {
            return (
                <button type="button" className="pass-item-checks-collapsed" onClick={expandFromCollapsed}>
                    {visibleChecks.map((checkType, index) => {
                        const { checkClass } = getCheckContent(checkType);
                        const title = getCollapsedCheckTitle(checkType);

                        return (
                            <Fragment key={checkType}>
                                {index > 0 && (
                                    <span className="pass-item-checks-collapsed-separator" aria-hidden>
                                        ·
                                    </span>
                                )}
                                <span
                                    className={clsx(
                                        'pass-item-checks-collapsed-item',
                                        `pass-item-checks-heading--${checkClass}`
                                    )}
                                >
                                    {title}
                                </span>
                            </Fragment>
                        );
                    })}
                </button>
            );
        }

        if (multipleChecks) {
            return <div className="pass-item-checks-rows pass-item-checks-rows--multi">{cards}</div>;
        }

        return cards;
    };

    return (
        <div className="pass-item-checks mb-2">
            <div className="pass-item-checks-card">
                <div
                    className={clsx(
                        'pass-item-checks-title-row',
                        multipleChecks && 'pass-item-checks-title-row--multi',
                        multipleChecks && expanded && 'pass-item-checks-title-row--expanded',
                        !multipleChecks && 'pass-item-checks-title-row--single'
                    )}
                >
                    {multipleChecks && (
                        <button
                            type="button"
                            className="pass-item-checks-toggle"
                            aria-expanded={expanded}
                            aria-label={
                                expanded
                                    ? c('Action').t`Collapse Pass Monitor alerts`
                                    : c('Action').t`Expand Pass Monitor alerts`
                            }
                            onClick={toggleExpanded}
                        >
                            {expanded ? <IcChevronDownFilled size={4} /> : <IcChevronRightFilled size={4} />}
                        </button>
                    )}
                    <div className="pass-item-checks-title">{c('Title').t`Pass Monitor`}</div>
                    {multipleChecks && (
                        <IcPassShieldWarning size={4} className="pass-item-checks-header-icon" aria-hidden />
                    )}
                </div>
                {renderChecks()}
            </div>
        </div>
    );
};
