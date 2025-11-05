import * as Sentry from "@sentry/electron/renderer";
import { disableMouseNavigation } from "@proton/shared/lib/desktop/disableMouseNavigation";

Sentry.init();

disableMouseNavigation();
