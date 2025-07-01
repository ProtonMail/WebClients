import { CompatibilityCheckView, getCompatibilityList } from '@proton/components';
import { APPS } from '@proton/shared/lib/constants';

export default { title: 'Components/Errors' };

export {
    GenericError,
    InternalServerError,
    AccessDeniedError,
    NotFoundError,
    StandardLoadErrorPage,
} from '@proton/components';

export const CompatibilityCheck = () => {
    return <CompatibilityCheckView appName={APPS.PROTONMAIL} incompatibilities={getCompatibilityList()} />;
};
