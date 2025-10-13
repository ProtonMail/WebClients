import { type FC, useMemo, useState } from 'react';

import { c } from 'ttag';

import Alert from '@proton/components/components/alert/Alert';
import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton';
import Icon from '@proton/components/components/icon/Icon';
import { ConfirmationModal } from '@proton/pass/components/Confirmation/ConfirmationModal';
import { Copy } from '@proton/pass/components/Copy/Copy';
import { Card } from '@proton/pass/components/Layout/Card/Card';
import { DropdownMenuButtonLabel } from '@proton/pass/components/Layout/Dropdown/DropdownMenuButton';
import { QuickActionsDropdown } from '@proton/pass/components/Layout/Dropdown/QuickActionsDropdown';
import { IconBox } from '@proton/pass/components/Layout/Icon/IconBox';
import { useRequest } from '@proton/pass/hooks/useRequest';
import { getViewCountString } from '@proton/pass/lib/i18n/helpers';
import { secureLinkRemove } from '@proton/pass/store/actions';
import type { SecureLink } from '@proton/pass/types';
import { epochToRemainingDuration } from '@proton/pass/utils/time/format';
import clsx from '@proton/utils/clsx';

type Props = SecureLink & { onClick: () => void };

export const SecureLinkCard: FC<Props> = ({
    expirationDate,
    itemId,
    linkId,
    readCount,
    maxReadCount,
    secureLink,
    shareId,
    onClick,
}) => {
    const [openRemoveModal, setOpenRemoveModal] = useState(false);

    const { dispatch } = useRequest(secureLinkRemove, { initial: { shareId, itemId } });
    const onRemove = () => dispatch({ itemId, shareId, linkId });

    const remaining = useMemo(
        () =>
            epochToRemainingDuration(expirationDate, {
                format: (remainingTime) => c('Info').t`Expires in ${remainingTime}`,
            }),
        [expirationDate]
    );

    const views = useMemo(
        () =>
            `${getViewCountString(readCount, maxReadCount)} ${readCount === maxReadCount ? `(${c('Label').t`max views reached`})` : ''}`,
        [maxReadCount, readCount]
    );

    return (
        <>
            <Card
                type="primary"
                className={clsx('mb-2 cursor-pointer rounded-xl ui-violet')}
                onClick={onClick}
                style={{ backgroundColor: 'var(--primary-minor-1)' }}
            >
                <div className="flex flex-nowrap items-center justify-space-between">
                    <IconBox mode="icon" size={3} pill={false} style={{ backgroundColor: 'var(--interaction-weak)' }}>
                        <Icon name="link" size={3} className="absolute inset-center" />
                    </IconBox>

                    <div className="flex-1 px-4">
                        <b>{c('Label').t`Shared link`}</b>
                        <div className="color-weak text-sm">
                            {remaining}
                            {' · '}
                            {views}
                        </div>
                    </div>
                    <div className="flex">
                        <Copy value={secureLink} shape="ghost" className="color-weak" pill />
                        <QuickActionsDropdown color="weak" shape="ghost" className="color-weak">
                            <DropdownMenuButton
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenRemoveModal(true);
                                }}
                                className="flex items-center gap-1 color-danger hover:color-danger"
                            >
                                <DropdownMenuButtonLabel label={c('Label').t`Remove link`} icon="cross-circle" danger />
                            </DropdownMenuButton>
                        </QuickActionsDropdown>
                    </div>
                </div>
            </Card>

            <ConfirmationModal
                open={openRemoveModal}
                onClose={() => setOpenRemoveModal(false)}
                onSubmit={onRemove}
                submitText={c('Action').t`Remove link`}
                title={c('Title').t`Remove secure link?`}
            >
                <Alert type="error">{c('Info').t`Are you sure you want to remove the link?`}</Alert>
            </ConfirmationModal>
        </>
    );
};
