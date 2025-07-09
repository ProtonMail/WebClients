import { useState } from 'react';

import { Button, CircleLoader } from '@proton/atoms';
import {
    Badge,
    Dropdown,
    DropdownMenu,
    DropdownMenuButton,
    Icon,
    useApi,
    useEventManager,
    useNotifications,
    usePopperAnchor,
    useTheme,
} from '@proton/components';
import useLoading from '@proton/hooks/useLoading';
import { IcCheckmark, IcCrossBig } from '@proton/icons';
import { labelConversations, unlabelConversations } from '@proton/shared/lib/api/conversations';
import { labelMessages, unlabelMessages } from '@proton/shared/lib/api/messages';
import clsx from '@proton/utils/clsx';

import { isMessage } from 'proton-mail/helpers/elements';
import type { Element } from 'proton-mail/models/element';

import { categoryBadgeMapping } from './categoryViewConstants';
import { isLabelIDCaregoryKey } from './categoryViewHelpers';
import { useCategoryViewExperiment } from './useCategoryViewExperiment';

import './CategoryBadge.scss';

interface Props {
    element?: Element;
    labelIDs?: string[];
    className?: string;
}

export const CategoryBadge = ({ element, labelIDs, className }: Props) => {
    const theme = useTheme();
    const { canSeeCategoryLabel } = useCategoryViewExperiment();

    const api = useApi();

    const [labelValue, setLabelValue] = useState(() =>
        (labelIDs || []).find((labelID) => isLabelIDCaregoryKey(labelID))
    );

    const { call } = useEventManager();
    const [loading, withLoading] = useLoading(false);
    const { createNotification } = useNotifications();
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();

    if (!labelValue || !canSeeCategoryLabel) {
        return null;
    }

    const data = categoryBadgeMapping[labelValue];
    if (!data) {
        return null;
    }

    const handleCategoryClick = async (category: string) => {
        if (!element) {
            return;
        }

        toggle();

        if (category === labelValue) {
            return;
        }

        const newLabelPayload = {
            LabelID: category,
            IDs: [element.ID],
        };

        const unlabelPayload = {
            LabelID: labelValue,
            IDs: [element.ID],
        };

        const promises = [];
        if (isMessage(element)) {
            promises.push(api(labelMessages(newLabelPayload)));
            promises.push(api(unlabelMessages(unlabelPayload)));
        } else {
            promises.push(api(labelConversations(newLabelPayload)));
            promises.push(api(unlabelConversations(unlabelPayload)));
        }

        await Promise.all(promises);
        setLabelValue(category);

        createNotification({
            text: 'The category has been updated, thanks for your feedback!',
        });

        await call();
    };

    return (
        <>
            <button
                ref={anchorRef}
                onClick={(e) => {
                    e.stopPropagation();

                    toggle();
                }}
                disabled={loading}
                className={clsx(
                    'badge-label-norm text-semibold w-fit-content shrink-0 flex items-center gap-2',
                    theme.information.dark ? data.darkClassName : data.className,
                    className
                )}
            >
                {loading && <CircleLoader size="small" />}
                {data.label}
            </button>

            <Dropdown
                anchorRef={anchorRef}
                isOpen={isOpen}
                originalPlacement="bottom"
                onClose={close}
                onClick={(e) => e.stopPropagation()}
            >
                <DropdownMenu className="p-3">
                    <div className="flex justify-between items-center flex-nowrap mb-2 gap-2">
                        <p className="p-0 pl-4 text-sm color-weak">
                            Which category should this be recategorized under?
                        </p>
                        <Button
                            icon
                            shape="ghost"
                            size="tiny"
                            onClick={(e) => {
                                e.stopPropagation();
                                toggle();
                            }}
                            className="shrink-0 color-weak"
                        >
                            <IcCrossBig />
                        </Button>
                    </div>
                    {Object.entries(categoryBadgeMapping).map(([key, value]) => {
                        const icon =
                            key === labelValue ? (
                                <>
                                    <IcCheckmark size={3} />
                                    <Icon name={value.icon} size={3} />
                                </>
                            ) : (
                                <Icon name={value.icon} size={3} />
                            );

                        return (
                            <DropdownMenuButton
                                key={key}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    void withLoading(handleCategoryClick(key));
                                }}
                                className="text-left"
                                disabled={loading}
                            >
                                <Badge
                                    className={clsx(
                                        'text-semibold w-fit-content shrink-0',
                                        theme.information.dark ? value.darkClassName : value.className
                                    )}
                                >
                                    <span className="flex items-center gap-2">
                                        {loading ? <CircleLoader size="small" /> : icon}
                                        {value.label}
                                    </span>
                                </Badge>
                            </DropdownMenuButton>
                        );
                    })}
                </DropdownMenu>
            </Dropdown>
        </>
    );
};
