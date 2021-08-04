import { TtagLocaleMap } from '@proton/shared/lib/interfaces/Locale';
import StandardPublicApp from './StandardPublicApp';
import MinimalLoginContainer from '../login/MinimalLoginContainer';
import { OnLoginCallback } from './interface';
import { ProminentContainer } from '../../components';

interface Props {
    onLogin: OnLoginCallback;
    locales: TtagLocaleMap;
}
const StandalonePublicApp = ({ onLogin, locales }: Props) => {
    return (
        <StandardPublicApp locales={locales}>
            <ProminentContainer>
                <MinimalLoginContainer onLogin={onLogin} />
            </ProminentContainer>
        </StandardPublicApp>
    );
};

export default StandalonePublicApp;
