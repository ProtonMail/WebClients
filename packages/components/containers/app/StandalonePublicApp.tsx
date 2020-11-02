import React from 'react';
import { TtagLocaleMap } from 'proton-shared/lib/interfaces/Locale';
import StandardPublicApp from './StandardPublicApp';
import MinimalLoginContainer from '../login/MinimalLoginContainer';
import { OnLoginCallback } from './interface';

interface Props {
    onLogin: OnLoginCallback;
    locales: TtagLocaleMap;
}
const StandalonePublicApp = ({ onLogin, locales }: Props) => {
    return (
        <StandardPublicApp locales={locales}>
            <MinimalLoginContainer onLogin={onLogin} />
        </StandardPublicApp>
    );
};

export default StandalonePublicApp;
