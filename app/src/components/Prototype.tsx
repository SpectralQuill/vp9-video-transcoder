import { AppContext } from "../contexts/AppContext";
import {
    Channel,
    invoke
} from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import {
    useContext,
    useEffect,
    useState
} from "react";

export function Prototype() {
    const { envMap: { VITE_PROTOTYPE_VIDEOS_PATH: videosPath } } = useContext(AppContext);
    const [videos, setVideos] = useState<string[]>([]);
    const [progress, setProgress] = useState<string>("");
    
    // useEffect(() => {
    //     const unlisten = listen<ProgressEvent>("transcode-progress", (event) => {
    //         setProgress((prev) => [...prev, event.payload]);
    //     });
        
    //     return () => {
    //         unlisten.then((fn) => fn());
    //     };
    // }, []);

    useEffect(() => {
        
        
        // const unlisten = listen("ffmpeg-log", (event) => {
        //     const log = event.payload as string;
        //     setProgress(log);
        // });

        // return () => {
        //     unlisten.then(f => f());
        // };
    }, []);
    
    const loadVideos = async () => {
        const files = await invoke<string[]>("get_video_list", {
            folder: videosPath
        });
        setVideos(files);
    };
    
    const startBatch = async () => {
        const jobs = videos.map((v) => [v, v.replace(/\.\w+$/, "_vp9.mp4")]);
        const onEvent = new Channel<TranscodeEvent>(payload => {
            if (!payload) return;
            setProgress(payload.time);
        });
        await invoke("transcode_vp9_batch", { jobs, onEvent });
    };
    
    return <>
        <h1>{videosPath}</h1>
        <div>
            <button onClick={loadVideos}>Load Videos</button>
            <button onClick={startBatch}>Transcode Batch</button>
            <h1>Loaded</h1>
            <ul>{
                videos.map(video => <li key={video}>{video}</li>)
            }</ul>
            <h1>In Progress</h1>
            <ul>{
                progress
                // progress.map((p, i) => (
                //     <li key={i}>
                //         {p.file}: {p.percent}%
                //     </li>
                // ))
            }</ul>
        </div>
    </>;
}
