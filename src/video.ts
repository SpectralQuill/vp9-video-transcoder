import * as fs from "fs";
import { ChildProcess } from "child_process";
import path from "path";

/**
 * Represents a video file and provides utility methods for video file operations.
 */
export default class Video {

    /**
     * A set of recognized video file extensions.
     */
    public static readonly VIDEO_EXTENSIONS: ReadonlySet<string> = new Set([
        ".mp4", ".mkv", ".webm", ".mov", ".avi", ".flv", ".wmv", ".m4v"
    ]);

    /**
     * Retrieves a list of video file paths from the specified directory.
     * @param folderPath Path to the target directory.
     * @returns Promise<string[]> Array of video file paths.
     */
    public static async getVideoList(folderPath: string): Promise<string[]> {
        // Get target directory from command line arguments
        const absPath = path.resolve(folderPath);
        let stat;
        try {
            stat = await fs.promises.stat(absPath);
        } catch {
            throw `Error: Path does not exist: ${absPath}`;
        }
        if (!stat.isDirectory()) throw `Error: Not a directory: ${absPath}`
        // Read directory contents
        const
            entries = await fs.promises.readdir(absPath, { withFileTypes: true }),
            videoList: string[] = []
        ;
        for (const entry of entries) {
            if (!entry.isFile()) continue;
            const { name } = entry;
            if (Video.isVideoFile(name)) videoList.push(path.join(absPath, name));
        }
        return videoList;
    }

    /**
     * Checks if the given file path has a video file extension.
     * @param filePath Path to the file.
     * @returns boolean
     */
    public static isVideoFile(filePath: string): boolean {
        const ext = path.extname(filePath).toLowerCase();
        return Video.VIDEO_EXTENSIONS.has(ext);
    }

    /**
     * Creates a new Video instance.
     * @param filePath Path to the video file, or null if not set.
     */
    public constructor(
        private filePath?: string,
        private process?: ChildProcess
    ) {}

    // FilePath methods

    /**
     * Clears the file path of the video.
     * @return void
     */
    public clearFilePath(): void {
        this.filePath = undefined;
    }

    /**
     * Gets the current file path of the video.
     * @returns string | null
     */
    public getFilePath(): string | undefined {
        return this.filePath;
    }

    /**
     * Sets the file path of the video.
     * @param filePath New file path to set.
     * @return void
     */
    public setFilePath(filePath: string): void {
        this.filePath = filePath;
    }

    // Process methods

    /**
     * Clears the ChildProcess associated with the video.
     * @return void
     */
    public clearProcess(): void {
        this.process = undefined;
    }

    /**
     * Gets the current ChildProcess associated with the video.
     * @returns ChildProcess | undefined
     * 
     */
    public getProcess(): ChildProcess | undefined {
        return this.process;
    }

    /**
     * Kills the ChildProcess associated with the video, if any.
     * @returns Promise<void>
     */
    public async killProcess(): Promise<void> {
        if (!this.process) return;
        return new Promise<void>(resolve => {
            this.process!.once("close", () => resolve());
            this.process!.kill("SIGKILL");
        });
    }

    /**
     * Sets the ChildProcess associated with the video.
     * @param process ChildProcess to set.
     * @return void
     */
    public setProcess(process: ChildProcess): void {
        this.process = process;
    }

    // Miscellaneous methods

    /**
     * Deletes the video file from the filesystem.
     * @returns Promise<void>
     */
    public async deleteFile(): Promise<void> {
        const { filePath } = this;
        if(!filePath || !Video.isVideoFile(filePath)) return Promise.resolve();
        return fs.promises.unlink(filePath);
    }

    /**
     * Checks if the video file exists on the filesystem.
     * @returns boolean
     */
    public exists(): boolean {
        return (this.filePath !== undefined) && fs.existsSync(this.filePath);
    }

}
