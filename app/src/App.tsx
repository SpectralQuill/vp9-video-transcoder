import {
    AppContext,
    AppContextProps
} from "./contexts/AppContext";
import { APP_ENV_SCHEMA } from "./constants/env";
import { EnvUtils } from "./utils/EnvUtils";
import {
    useMemo,
    useRef
} from "react";
import { Prototype } from "./components/Prototype";
import { TitleBar } from "./components/TitleBar";

import "./style/App.scss";

export default function App() {

    const envMap = useRef(EnvUtils.getEnvMap(APP_ENV_SCHEMA)).current;
    const appContext = useMemo<AppContextProps>(() => ({
        envMap
    }), []);

    return <AppContext.Provider value={appContext}>
        <TitleBar />
        <Prototype />
    </AppContext.Provider>;
    
}
