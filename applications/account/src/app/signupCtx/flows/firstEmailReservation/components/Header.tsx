import { Logo } from '@proton/components/index';
import { APPS } from '@proton/shared/lib/constants';

const Header = () => {
    return (
        <header className="flex shrink-0 w-full mx-auto pt-6 px-6 pb-0 md:pb-6 max-w-custom">
            <Logo appName={APPS.PROTONMAIL} hasTitle />
        </header>
    );
};

export default Header;
