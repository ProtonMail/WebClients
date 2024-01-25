import { type FC, memo } from 'react';
import { useSelector } from 'react-redux';
import { Link, type LinkProps } from 'react-router-dom';

import { ButtonLike, type ButtonLikeProps } from '@proton/atoms/Button';
import { Icon, Marks } from '@proton/components/components';
import { useBulkSelect } from '@proton/pass/components/Bulk/BulkSelectProvider';
import { IconBox } from '@proton/pass/components/Layout/Icon/IconBox';
import { ItemIcon, ItemIconIndicators, SafeItemIcon } from '@proton/pass/components/Layout/Icon/ItemIcon';
import { itemTypeToSubThemeClassName } from '@proton/pass/components/Layout/Theme/types';
import { VaultIcon } from '@proton/pass/components/Vault/VaultIcon';
import { useBulkInFlight } from '@proton/pass/hooks/useBulkInFlight';
import { useFeatureFlag } from '@proton/pass/hooks/useFeatureFlag';
import { matchChunks } from '@proton/pass/lib/search/match-chunks';
import { selectShare } from '@proton/pass/store/selectors';
import type { ItemRevisionWithOptimistic, ShareType } from '@proton/pass/types';
import { PassFeature } from '@proton/pass/types/api/features';
import { isEmptyString } from '@proton/pass/utils/string/is-empty-string';
import clsx from '@proton/utils/clsx';

import { presentListItem } from './utils';

import './ItemsListItem.scss';

type Props = Partial<LinkProps> &
    ButtonLikeProps<any> & {
        item: ItemRevisionWithOptimistic;
        search?: string;
        active?: boolean;
    };

const ItemsListItemRaw: FC<Props> = ({ item, search = '', active = false, ...rest }) => {
    const { data, optimistic, failed, shareId } = item;
    const { heading, subheading } = presentListItem(item);
    const vault = useSelector(selectShare<ShareType.Vault>(shareId));
    const pinningEnabled = useFeatureFlag(PassFeature.PassPinningV1);
    const bulk = useBulkSelect();
    const bulkSelected = bulk.isSelected(item);
    const bulkInFlight = useBulkInFlight(item);
    const loading = optimistic || bulkInFlight;

    return (
        <div className={clsx(bulk.enabled && 'px-1 py-0.5')}>
            <ButtonLike
                as={Link}
                to="#"
                className={clsx([
                    'pass-item-list--item interactive-pseudo w-full',
                    bulk.enabled && 'pass-item-list--item-bulk',
                    bulkSelected && 'pass-item-list--item-bulk-selected',
                    active && 'is-active',
                ])}
                color={failed ? 'warning' : 'weak'}
                shape="ghost"
                style={{ '--anime-opacity': loading ? '0.5' : '1' }}
                {...rest}
            >
                <div
                    className={clsx('flex-nowrap flex w-full items-center', bulk.enabled ? 'px-2 py-1.5' : 'px-3 py-2')}
                >
                    <SafeItemIcon
                        item={item}
                        size={5}
                        className={clsx('mr-3 shrink-0 relative', itemTypeToSubThemeClassName[data.type])}
                        iconClassName={clsx(loading && 'opacity-50')}
                        renderIndicators={(size) => (
                            <>
                                {bulk.enabled ? (
                                    <ItemIcon
                                        alt=""
                                        className={'ui-standard absolute bulk-select-check pass-item-list--checkmark'}
                                        icon={'checkmark'}
                                        loadImage={false}
                                        normColor={false}
                                        pill
                                        size={5}
                                    />
                                ) : (
                                    <ItemIconIndicators size={size} loading={loading} error={item.failed} />
                                )}

                                {pinningEnabled && item.pinned && (
                                    <IconBox
                                        size={2.5}
                                        mode="transparent"
                                        className={clsx(
                                            'pass-item-list--item--pin absolute bottom-custom right-custom flex items-center justify-center',
                                            itemTypeToSubThemeClassName[data.type]
                                        )}
                                        style={{ '--bottom-custom': '-6px', '--right-custom': '-6px' }}
                                    >
                                        <Icon
                                            name="pin-angled-filled"
                                            size={2.75}
                                            className="absolute-center"
                                            color="black"
                                        />
                                    </IconBox>
                                )}
                            </>
                        )}
                    />

                    <div className={clsx('text-left', loading && !failed && 'opacity-50')}>
                        <span className="flex items-center">
                            {search && (
                                <VaultIcon size={3} icon={vault?.content.display.icon} className="color-weak mr-1" />
                            )}
                            <span className="flex-1 text-ellipsis">
                                <Marks chunks={matchChunks(heading, search)}>{heading}</Marks>
                            </span>
                        </span>
                        <div
                            className={clsx([
                                'pass-item-list--subtitle block color-weak text-sm text-ellipsis',
                                item.data.type === 'note' && isEmptyString(item.data.metadata.note.v) && 'text-italic',
                            ])}
                        >
                            <Marks chunks={matchChunks(subheading, search)}>{subheading}</Marks>
                        </div>
                    </div>
                </div>
            </ButtonLike>
        </div>
    );
};

export const ItemsListItem = memo(ItemsListItemRaw);
