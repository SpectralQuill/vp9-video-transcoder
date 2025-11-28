import * as fs from "fs";
import path from "path";

export const VIDEO_EXTENSIONS: ReadonlySet<string> = new Set([
    ".mp4",
    ".mkv",
    ".webm",
    ".mov",
    ".avi",
    ".flv",
    ".wmv",
    ".m4v"
]);

/**
 * Represents a video file and provides utility methods for video file operations.
 */
export class Video {

    /**
     * Retrieves a list of video file paths from the specified directory.
     * @param folderPath Path to the target directory.
     * @returns Promise<string[]> Array of video file paths.
     */
    static async getVideoList(folderPath: string): Promise<string[]> {
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
    static isVideoFile(filePath: string): boolean {
        const ext = path.extname(filePath).toLowerCase();
        return VIDEO_EXTENSIONS.has(ext);
    }

    /**
     * Creates a new Video instance.
     * @param filePath Path to the video file, or null if not set.
     */
    constructor(public filePath: string | null) {}

    /**
     * Clears the file path of the video.
     * @return void
     */
    clearFilePath(): void {
        this.filePath = null;
    }

    /**
     * Deletes the video file from the filesystem.
     * @returns Promise<void>
     */
    async deleteFile(): Promise<void> {
        const { filePath } = this;
        if(!filePath || !Video.isVideoFile(filePath)) return Promise.resolve();
        return fs.promises.unlink(filePath);
    }

    /**
     * Checks if the video file exists on the filesystem.
     * @returns boolean
     */
    exists(): boolean {
        return this.filePath !== null && fs.existsSync(this.filePath);
    }

    /**
     * Gets the current file path of the video.
     * @returns string | null
     */
    getFilePath(): string | null {
        return this.filePath;
    }

    /**
     * Sets the file path of the video.
     * @param filePath New file path to set.
     * @return void
     */
    setFilePath(filePath: string): void {
        this.filePath = filePath;
    }

}
