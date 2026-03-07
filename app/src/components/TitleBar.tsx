import { WebviewWindow } from "@tauri-apps/api/webviewWindow";

import "../style/TitleBar.scss";

export function TitleBar() {

    const appWindow = new WebviewWindow("main");
    
    const minimize = () => appWindow.minimize();
    const maximize = async () => {
        const maximized = await appWindow.isMaximized();
        maximized ? appWindow.unmaximize() : appWindow.maximize();
    };
    const close = () => appWindow.close();
    
    return <>
        <div
            id="title-bar"
        >
            <div style={{ display: "flex", alignItems: "center" }}>
                {/* <img src="/logo.png" alt="Logo" style={{ height: 20, marginRight: 8 }} /> */}
                <span>VP9 Video Transcoder</span>
                {/* <button style={{ marginLeft: 12, WebkitAppRegion: "no-drag" }}>← Back</button>
                <button style={{ WebkitAppRegion: "no-drag" }}>→ Forward</button> */}
            </div>
            <div className="window-control-buttons-wrapper">
                <button onClick={minimize}>─</button>
                <button onClick={maximize}>⬜</button>
                <button onClick={close}>✕</button>
            </div>
        </div>
    </>;

}
