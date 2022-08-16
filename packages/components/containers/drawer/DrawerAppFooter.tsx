import { ReactElement, cloneElement } from 'react';

import Footer from '@proton/components/components/footer/Footer';

interface Props {
    buttons: ReactElement[];
}

const DrawerAppFooter = ({ buttons }: Props) => {
    const hasFooter = buttons.length > 0;

    if (!hasFooter) {
        return null;
    }

    // Adding keys to buttons
    const clonedButtons = buttons.map((button, index) =>
        cloneElement(button, { key: button.key || `footer-button-${index}` })
    );

    return (
        <div className="relative">
            <Footer className="p1 flex-column flex-gap-0-5">{clonedButtons}</Footer>
        </div>
    );
};

export default DrawerAppFooter;
