import { type FC, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { ModalTwoContent, ModalTwoFooter, ModalTwoHeader } from '@proton/components';
import { PassModal } from '@proton/pass/components/Layout/Modal/PassModal';
import { PassThemeCardList } from '@proton/pass/components/Settings/PassThemeCardList';
import { PASS_DEFAULT_THEME } from '@proton/pass/constants';
import { settingsEditIntent } from '@proton/pass/store/actions';
import { selectTheme } from '@proton/pass/store/selectors';

/** This component can be deleted once the theme feature is no longer considered new
 * and we want to stop prompting this modal to users */
export const ThemeOnboardingModal: FC = () => {
    const theme = useSelector(selectTheme);
    const [open, setOpen] = useState(!theme);
    const dispatch = useDispatch();

    const handleClose = () => {
        if (!theme) dispatch(settingsEditIntent('theme', { theme: PASS_DEFAULT_THEME }, true));
        setOpen(false);
    };

    return (
        open && (
            <PassModal size="large" open onClose={handleClose} disableCloseOnEscape>
                <ModalTwoHeader
                    title={c('Info').t`Make it your own`}
                    hasClose={false}
                    className="flex justify-center"
                />
                <ModalTwoContent className="flex flex-column items-center">
                    <div className="color-weak mb-4">{c('Info').t`Choose your preferred look and feel.`}</div>
                    <PassThemeCardList />
                </ModalTwoContent>

                <ModalTwoFooter className="flex flex-column items-stretch text-center">
                    <Button pill size="large" shape="solid" color="norm" onClick={handleClose}>
                        {c('Action').t`Select`}
                    </Button>
                </ModalTwoFooter>
            </PassModal>
        )
    );
};
