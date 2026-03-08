import {
    faMinus,
    faXmark
} from '@fortawesome/free-solid-svg-icons';
import {
    faWindowMaximize,
    faWindowRestore
} from '@fortawesome/free-regular-svg-icons';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    useEffect,
    useRef,
    useState
} from "react";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";

import "../style/TitleBar.scss";

export function TitleBar() {
    
    const appWindow = useRef(new WebviewWindow("main")).current;
    const [maximized, setMaximized] = useState<boolean>(true);
    
    const minimize = async () => appWindow.minimize();
    const toggleMaximize = async () => {
        await (maximized ? appWindow.unmaximize() : appWindow.maximize());
        setMaximized(!maximized);
    };
    const close = async () => appWindow.close();

    useEffect(() => {(async () => {

        const maximized = await appWindow.isMaximized();
        setMaximized(maximized);

    })()}, []);
    
    return <>
        <div className="title-bar" data-tauri-drag-region>
            <div className="title-wrapper" data-tauri-drag-region>
                {/* <img src="/logo.png" alt="Logo" style={{ height: 20, marginRight: 8 }} /> */}
                <span data-tauri-drag-region>VP9 Video Transcoder</span>
                {/* <button style={{ marginLeft: 12, WebkitAppRegion: "no-drag" }}>← Back</button>
                <button style={{ WebkitAppRegion: "no-drag" }}>→ Forward</button> */}
            </div>
            <div className="window-control-buttons-wrapper">
                <button onClick={minimize}>
                    <FontAwesomeIcon icon={faMinus} />
                </button>
                <button onClick={toggleMaximize}>
                    <FontAwesomeIcon
                        icon={maximized? faWindowRestore : faWindowMaximize}
                    />
                </button>
                <button onClick={close}>
                    <FontAwesomeIcon icon={faXmark} />
                </button>
            </div>
        </div>
    </>;

}
