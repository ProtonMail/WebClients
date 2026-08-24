import { type FC, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';

import { settingsEditIntent } from '../../../store/actions';
import { selectTheme } from '../../../store/selectors';
import { usePassCore } from '../../Core/PassCoreProvider';
import { PassThemeCardList } from '../../Settings/PassThemeCardList';
import { PassModal } from '../Modal/PassModal';

/** This component can be deleted once the theme feature is no longer considered new
 * and we want to stop prompting this modal to users */
export const ThemeOnboardingModal: FC = () => {
    const core = usePassCore();
    const theme = useSelector(selectTheme);
    const [open, setOpen] = useState(!theme);
    const dispatch = useDispatch();

    const handleClose = () => {
        if (!theme) dispatch(settingsEditIntent('theme', { theme: core.theme.getState() }, true));
        setOpen(false);
    };

    return (
        open && (
            <PassModal size="large" open onClose={handleClose} enableCloseWhenClickOutside>
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
