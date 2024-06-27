import { type FC, useState } from 'react';

import { c } from 'ttag';

import { Alert, DropdownMenuButton } from '@proton/components';
import { Copy, Icon } from '@proton/components/components';
import { useNotifications } from '@proton/components/hooks';
import { ConfirmationModal } from '@proton/pass/components/Confirmation/ConfirmationModal';
import { Card } from '@proton/pass/components/Layout/Card/Card';
import { QuickActionsDropdown } from '@proton/pass/components/Layout/Dropdown/QuickActionsDropdown';
import { IconBox } from '@proton/pass/components/Layout/Icon/IconBox';
import { useRequest } from '@proton/pass/hooks/useActionRequest';
import { itemRemoveSecureLink } from '@proton/pass/store/actions';
import { itemDeleteSecureLinkRequest } from '@proton/pass/store/actions/requests';
import type { SecureLink } from '@proton/pass/types';
import { timeRemaining } from '@proton/pass/utils/time/format';

type Props = SecureLink & { onClick: () => void };

export const SecureLinkCard: FC<Props> = ({
    expirationDate,
    itemId,
    linkId,
    readCount,
    secureLink,
    shareId,
    onClick,
}) => {
    const { createNotification } = useNotifications();
    const [openRemoveModal, setOpenRemoveModal] = useState(false);

    const initialRequestId = itemDeleteSecureLinkRequest(shareId, itemId);
    const { dispatch } = useRequest(itemRemoveSecureLink, { initialRequestId });

    const onCopy = () => createNotification({ text: c('Info').t`Copied to clipboard` });
    const onRemove = () => dispatch({ itemId, shareId, linkId });

    return (
        <>
            <Card type="primary" className="mb-4 cursor-pointer" onClick={onClick}>
                <div className="flex flex-nowrap items-center justify-space-between">
                    <IconBox
                        mode="icon"
                        size={5}
                        pill={false}
                        style={{ backgroundColor: 'var(--interaction-weak-major-1)' }}
                    >
                        <Icon name="link" size={4} className="absolute inset-center" />
                    </IconBox>

                    <div className="flex-1 px-4">
                        <b>{c('Label').t`Shared link`}</b>
                        <div className="color-weak">
                            Expires in {timeRemaining(expirationDate)} · {readCount} view
                        </div>
                    </div>
                    <div>
                        <Copy value={secureLink} shape="ghost" className="color-weak" onCopy={onCopy} pill />
                        <QuickActionsDropdown color="weak" shape="ghost" className="color-weak">
                            <DropdownMenuButton
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenRemoveModal(true);
                                }}
                                className="flex items-center gap-1 color-danger hover:color-danger"
                            >
                                <Icon name="cross-circle" size={4} />
                                <span>{c('Label').t`Remove link`}</span>
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
