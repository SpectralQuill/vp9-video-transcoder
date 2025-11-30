import {
    ChildProcess,
    spawn
} from "child_process";
import path from "path";
import Video from "./video";

/**
 * FFmpeg utility class for video transcoding.
 */
export default class FFmpeg {
    
    /**
     * Runs FFmpeg with the specified arguments.
     * @param args Array of FFmpeg command-line arguments.
     * @returns [ChildProcess, Promise<void>]
     */
    private static run(args: string[]): [ChildProcess, Promise<void>] {
        const
            ff = spawn("ffmpeg", args, { stdio: "inherit" }),
            done = new Promise<void>((resolve, reject) => {
                ff.on("error", reject);
                ff.on("close", code => {
                    if (code !== 0) reject(new Error(`FFmpeg exited with code ${code}`));
                    else resolve();
                });
            })
        ;
        return [ ff, done ];
    }

    /**
     * Transcodes a video file to VP9 format using a two-pass encoding process.
     * @param inputPath Path to the input video file.
     * @param outputPath Path to the output VP9 transcoded video file.
     * @param tracker Optional Video object to track the current output file.
     * @returns Promise<void>
     */
    public static async transcodeVp9(
        inputPath: string,
        outputPath: string,
        tracker?: Video
    ): Promise<void> {
        const
            absIn = path.resolve(inputPath),
            absOut = path.resolve(outputPath)
        ;
        // Pass 1
        console.log("Running pass 1...");
        await FFmpeg.run([
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
            (process.platform === "win32" ? "NUL" : "/dev/null")
        ]);
        if (tracker) tracker.setFilePath(absOut);
        // Pass 2
        console.log("Running pass 2...");
        await FFmpeg.run([
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
        ]);
        console.log(`Encoding complete → ${absOut}`);
        if(tracker) tracker.clearFilePath();
    }

    /**
     * Transcodes multiple video files to VP9 format in a batch process.
     * @param jobs An object where keys are input file paths and values are output file paths.
     * @returns Promise<void>
     */
    public static async transcodeVp9Batch(jobs: Record<string, string>): Promise<void> {
        const tracker = new Video();

        async function handleSignal() {
            const filePath = tracker.getFilePath();
            await tracker.deleteFile();
            console.log(`Deleted incomplete output: ${filePath}`);
            process.exit(1);
        }

        process.once("SIGINT", handleSignal);
        process.once("SIGTERM", handleSignal);

        const totalJobs = Object.keys(jobs).length;
        let count = 1;
        console.log(`Videos to convert: ${totalJobs}`);
        for (const inputFile in jobs) {
            const outputFile = jobs[inputFile];
            console.log(`Encoding (${count}/${totalJobs}):\n\tFrom:\t${path.basename(inputFile)}\n\tTo:\t${path.basename(outputFile)}`);
            await FFmpeg.transcodeVp9(inputFile, outputFile, tracker);
            count++;
        }
    }

}
