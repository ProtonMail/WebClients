import type { ReactNode } from 'react';

import { Button, ButtonLike } from '@proton/atoms';
import SettingsLink from '@proton/components/components/link/SettingsLink';

interface Props {
    closeModal: () => void;
    onClick: () => void;
    path?: string;
    submitText?: ReactNode | ((closeModal: () => void) => ReactNode);
}

const UpsellModalUpgradeButton = ({ path, onClick, submitText, closeModal }: Props) => {
    if (typeof submitText === 'function') {
        return submitText(closeModal);
    }

    if (path) {
        return (
            <ButtonLike
                as={SettingsLink}
                color="norm"
                fullWidth
                onClick={onClick}
                path={path}
                shape="solid"
                size="medium"
            >
                {submitText}
            </ButtonLike>
        );
    }

    return (
        <Button color="norm" fullWidth size="medium" shape="solid" onClick={onClick}>
            {submitText}
        </Button>
    );
};

export default UpsellModalUpgradeButton;
