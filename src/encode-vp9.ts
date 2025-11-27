import { spawn } from "child_process";
import path from "path";

function runFFmpeg(args: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
        const ff = spawn("ffmpeg", args, { stdio: "inherit" });
        ff.on("error", (err) => reject(err));
        ff.on("close", (code) => {
            if (code !== 0) reject(new Error(`FFmpeg exited with code ${code}`));
            else resolve();
        });
    });
}

export async function encodeVp9(inputPath: string, outputPath: string): Promise<void> {
    const
        absIn = path.resolve(inputPath),
        absOut = path.resolve(outputPath),
        nullDev = (process.platform === "win32" ? "NUL" : "/dev/null")
    ;
    // Pass 1
    const pass1Args = [
        "-i", absIn,
        "-vf", "scale=-1:720",
        "-c:v", "libvpx-vp9",
        "-b:v", "0",
        "-crf", "30",
        "-cpu-used", "1",
        "-row-mt", "1",
        "-tile-columns", "1",
        "-threads", "8",
        "-pass", "1",
        "-an",
        "-f", "mp4",
        nullDev
    ];
    console.log("Running pass 1...");
    await runFFmpeg(pass1Args);
    // Pass 2
    const pass2Args = [
        "-i", absIn,
        "-vf", "scale=-1:720",
        "-c:v", "libvpx-vp9",
        "-b:v", "0",
        "-crf", "30",
        "-cpu-used", "1",
        "-row-mt", "1",
        "-tile-columns", "1",
        "-threads", "8",
        "-pass", "2",
        "-c:a", "aac",
        "-b:a", "128k",
        absOut
    ];
    console.log("Running pass 2...");
    await runFFmpeg(pass2Args);
    console.log(`Encoding complete → ${absOut}`);
}
