import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import { listen } from "@tauri-apps/api/event";

interface ProgressEvent {
    file: string;
    percent: number;
};

const VIDEOS_PATH = "C:/Videos";

export function Prototype() {
    const [videos, setVideos] = useState<string[]>([]);
    const [progress, setProgress] = useState<ProgressEvent[]>([]);
    
    useEffect(() => {
        const unlisten = listen<ProgressEvent>("transcode-progress", (event) => {
            setProgress((prev) => [...prev, event.payload]);
        });
        
        return () => {
            unlisten.then((fn) => fn());
        };
    }, []);
    
    const loadVideos = async () => {
        const files = await invoke<string[]>("get_video_list", {
            folder: VIDEOS_PATH
        });
        setVideos(files);
    };
    
    const startBatch = async () => {
        const jobs = videos.map((v) => [v, v.replace(/\.\w+$/, "_vp9.mp4")]);
        await invoke("transcode_vp9_batch", { jobs });
    };
    
    return <>
        <div>
            <button onClick={loadVideos}>Load Videos</button>
            <button onClick={startBatch}>Transcode Batch</button>
            <h1>Loaded</h1>
            <ul>{
                videos.map(video => <li key={video}>{video}</li>)
            }</ul>
            <h1>In Progress</h1>
            <ul>{
                progress.map((p, i) => (
                    <li key={i}>
                        {p.file}: {p.percent}%
                    </li>
                ))
            }</ul>
        </div>
    </>;
}
