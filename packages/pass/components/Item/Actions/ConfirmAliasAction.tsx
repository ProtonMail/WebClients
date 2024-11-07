import type { FC } from 'react';
import { type ReactNode, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Alert, Checkbox, ModalTwoContent, ModalTwoFooter, ModalTwoHeader } from '@proton/components';
import { PassModal } from '@proton/pass/components/Layout/Modal/PassModal';
import { pipe } from '@proton/pass/utils/fp/pipe';

type Props = {
    actionText: string;
    disableText?: string;
    message: ReactNode;
    remember: boolean;
    title: string;
    warning?: ReactNode;
    onAction: (noRemind: boolean) => void;
    onClose: () => void;
    onDisable?: (noRemind: boolean) => void;
};

export const ConfirmAliasAction: FC<Props> = ({
    actionText,
    disableText,
    message,
    remember,
    title,
    warning,
    onAction,
    onClose,
    onDisable,
}) => {
    const [noRemind, setNoRemind] = useState(false);

    return (
        <PassModal onClose={onClose} onReset={onClose} enableCloseWhenClickOutside open size="small">
            <ModalTwoHeader title={title} closeButtonProps={{ pill: true }} />
            <ModalTwoContent>
                {warning && (
                    <Alert className="mb-4" type="error">
                        {warning}
                    </Alert>
                )}

                {message && <div>{message}</div>}
            </ModalTwoContent>
            <ModalTwoFooter className="flex flex-column items-stretch text-center">
                {remember && (
                    <Checkbox
                        className="pass-checkbox--unset gap-0 mb-4"
                        checked={noRemind}
                        onChange={({ target }) => setNoRemind(target.checked)}
                    >
                        {c('Label').t`Don't remind me again`}
                    </Checkbox>
                )}

                <Button color="danger" onClick={() => onAction(noRemind)} shape="solid" size="large" pill>
                    {actionText}
                </Button>

                {onDisable && (
                    <Button
                        color="norm"
                        onClick={pipe(() => onDisable(noRemind), onClose)}
                        shape="solid"
                        size="large"
                        pill
                    >
                        {disableText ?? c('Action').t`Disable alias`}
                    </Button>
                )}

                <Button onClick={onClose} size="large" shape="outline" color="norm" pill>
                    {c('Action').t`Cancel`}
                </Button>
            </ModalTwoFooter>
        </PassModal>
    );
};
