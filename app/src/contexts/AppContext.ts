import { APP_ENV_SCHEMA } from "../constants/env";
import { createContext } from "react";
import { EnvMap } from "../utils/EnvUtils";

export interface AppContextProps {
    envMap: EnvMap<typeof APP_ENV_SCHEMA>
}

export const AppContext = createContext<AppContextProps>({
    envMap: {} as EnvMap<typeof APP_ENV_SCHEMA>
});
