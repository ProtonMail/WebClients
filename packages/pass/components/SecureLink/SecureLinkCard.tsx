import { type FC, useMemo, useState } from 'react';

import { c } from 'ttag';

import { Alert, DropdownMenuButton, Icon } from '@proton/components';
import { useNotifications } from '@proton/components/hooks';
import { ConfirmationModal } from '@proton/pass/components/Confirmation/ConfirmationModal';
import { Copy } from '@proton/pass/components/Copy/Copy';
import { Card } from '@proton/pass/components/Layout/Card/Card';
import { DropdownMenuButtonLabel } from '@proton/pass/components/Layout/Dropdown/DropdownMenuButton';
import { QuickActionsDropdown } from '@proton/pass/components/Layout/Dropdown/QuickActionsDropdown';
import { IconBox } from '@proton/pass/components/Layout/Icon/IconBox';
import { useRequest } from '@proton/pass/hooks/useActionRequest';
import { getViewCountString } from '@proton/pass/lib/i18n/helpers';
import { secureLinkRemove } from '@proton/pass/store/actions';
import { secureLinkRemoveRequest } from '@proton/pass/store/actions/requests';
import type { SecureLink } from '@proton/pass/types';
import { timeRemaining } from '@proton/pass/utils/time/format';
import clsx from '@proton/utils/clsx';

type Props = SecureLink & { onClick: () => void };

export const SecureLinkCard: FC<Props> = ({
    active,
    expirationDate,
    itemId,
    linkId,
    readCount,
    maxReadCount,
    secureLink,
    shareId,
    onClick,
}) => {
    const { createNotification } = useNotifications();
    const [openRemoveModal, setOpenRemoveModal] = useState(false);

    const initialRequestId = secureLinkRemoveRequest(shareId, itemId);
    const { dispatch } = useRequest(secureLinkRemove, { initialRequestId });

    const onCopy = () => createNotification({ text: c('Info').t`Copied to clipboard` });
    const onRemove = () => dispatch({ itemId, shareId, linkId });

    const remaining = useMemo(
        () =>
            timeRemaining(expirationDate, {
                format: (remainingTime) => c('Info').t`Expires in ${remainingTime}`,
                expiredLabel: c('Label').t`Expired link`,
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
                style={{
                    '--card-background': '#202038',
                    backgroundColor: `var(${active ? '--card-background' : '--primary-minor-2'})`,
                }}
            >
                <div className="flex flex-nowrap items-center justify-space-between">
                    <IconBox
                        mode="icon"
                        size={3}
                        pill={false}
                        style={{ backgroundColor: `var(${active ? '--interaction-weak' : '--primary-minor-1'})` }}
                    >
                        <Icon name={active ? 'link' : 'link-slash'} size={3} className="absolute inset-center" />
                    </IconBox>

                    <div className="flex-1 px-4">
                        <b>{active ? c('Label').t`Shared link` : c('Label').t`Expired link`}</b>
                        <div className="color-weak text-sm">
                            {remaining}
                            {' · '}
                            {views}
                        </div>
                    </div>
                    <div>
                        {active && (
                            <Copy value={secureLink} shape="ghost" className="color-weak" onCopy={onCopy} pill />
                        )}
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
