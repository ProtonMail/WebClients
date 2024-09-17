import { type FC, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { c } from 'ttag';

import { Button } from '@proton/atoms/index';
import { ModalTwoContent, ModalTwoFooter, ModalTwoHeader } from '@proton/components/index';
import { PillBadge } from '@proton/pass/components/Layout/Badge/PillBadge';
import { PassModal } from '@proton/pass/components/Layout/Modal/PassModal';
import { ThemeSelector } from '@proton/pass/components/Settings/ThemeSelector';
import { selectTheme } from '@proton/pass/store/selectors';

import { PASS_DEFAULT_THEME } from '../../../constants';
import { settingsEditIntent } from '../../../store/actions';

/** This component can be deleted once the theme feature is no longer considered new
 * and we want to stop prompting this modal to users */
export const ThemeOnboardingModal: FC = () => {
    const theme = useSelector(selectTheme);
    const [open, setOpen] = useState(theme === undefined);
    const dispatch = useDispatch();

    const handleClose = () => {
        if (theme === undefined) {
            dispatch(settingsEditIntent('theme', { theme: PASS_DEFAULT_THEME }, true));
        }
        setOpen(false);
    };

    if (!open) return null;

    return (
        <PassModal size="large" open onClose={handleClose} disableCloseOnEscape>
            <ModalTwoHeader
                title={
                    <>
                        {c('Info').t`Choose a theme`}
                        <PillBadge className="text-semibold ml-2 py-2" label={c('Badge').t`New`} />
                    </>
                }
            />
            <ModalTwoContent className="flex flex-column items-center pt-4">
                <ThemeSelector className="mb-4" />
                <div className="color-weak">{c('Info').t`You can always change your theme later in the settings.`}</div>
            </ModalTwoContent>

            <ModalTwoFooter className="flex flex-column items-stretch text-center">
                <Button pill size="large" shape="solid" onClick={handleClose}>
                    {c('Action').t`Done`}
                </Button>
            </ModalTwoFooter>
        </PassModal>
    );
};
