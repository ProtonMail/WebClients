import React from "react";
import { Route, Switch } from "react-router-dom";
import {
  StandardPublicApp,
  LoginForm,
  SignupContainer,
  ModalsChildren
} from "react-components";
import locales from "../locales";

interface Props {
  onLogin: () => void;
}

const PublicApp = ({ onLogin }: Props) => {
  return (
    <StandardPublicApp locales={locales}>
      <ModalsChildren />
      <Switch>
        <Route
          path="/signup"
          render={({ location, history }) => (
            <SignupContainer
              location={location}
              history={history}
              onLogin={onLogin}
            />
          )}
        />
        <Route path="/login" render={() => <LoginForm onLogin={onLogin} />} />
      </Switch>
    </StandardPublicApp>
  );
};

export default PublicApp;
