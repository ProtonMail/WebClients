import { Logo } from '@proton/components/index';
import { APPS } from '@proton/shared/lib/constants';

const BornPrivateHeader = () => {
    return (
        <header className="flex items-center justify-space-between shrink-0 w-full mx-auto py-6">
            <Logo appName={APPS.PROTONMAIL} hasTitle />
        </header>
    );
};

export default BornPrivateHeader;
