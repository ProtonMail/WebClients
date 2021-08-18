import { CompatibilityCheckView, getCompatibilityList } from '@proton/components';
import { APPS } from '@proton/shared/lib/constants';
import { getTitle } from '../../helpers/title';

export default { title: getTitle(__filename) };

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
