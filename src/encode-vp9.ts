import { exec } from "child_process";
import path from "path";
import { promisify } from "util";

const execAsync = promisify(exec);

/**
 * Encode a video to VP9 (2-pass) at 720p.
 *
 * @param inputPath Absolute path to the source video file
 * @param outputPath Absolute path for encoded MP4 output
 */
export async function encodeVp9(inputPath: string, outputPath: string): Promise<void> {
    const
        absIn = path.resolve(inputPath),
        absOut = path.resolve(outputPath)
    ;
    // Pass 1
    const pass1Cmd = [
        `ffmpeg`,
        `-i "${absIn}"`,
        `-vf "scale=-1:720"`,
        `-c:v libvpx-vp9`,
        `-b:v 0`,
        `-crf 30`,
        `-cpu-used 1`,
        `-row-mt 1`,
        `-tile-columns 1`,
        `-threads 8`,
        `-pass 1`,
        `-an`,
        `-f mp4`,
        process.platform === "win32" ? `NUL` : `/dev/null`
    ].join(" ");
    // Pass 2
    const pass2Cmd = [
        `ffmpeg`,
        `-i "${absIn}"`,
        `-vf "scale=-1:720"`,
        `-c:v libvpx-vp9`,
        `-b:v 0`,
        `-crf 30`,
        `-cpu-used 1`,
        `-row-mt 1`,
        `-tile-columns 1`,
        `-threads 8`,
        `-pass 2`,
        `-c:a aac`,
        `-b:a 128k`,
        `"${absOut}"`
    ].join(" ");

    console.log(`Running pass 1...`);
    await execAsync(pass1Cmd);

    console.log(`Running pass 2...`);
    await execAsync(pass2Cmd);

    console.log(`Encoding complete → ${absOut}`);
}
