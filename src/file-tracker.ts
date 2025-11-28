import * as fs from "fs";
import path from "path";
import { VIDEO_EXTENSIONS } from "./video-extensions";

/**
 * Tracks the current file being processed in a batch encoding operation.
 */
export class FileTracker {

    private current: string | null = null;

    setFile(filePath: string): void {
        this.current = filePath;
    }

    clearFile(): void {
        this.current = null;
    }

    getFile(): string | null {
        return this.current;
    }

    isVideoFile(): boolean {
        const { current } = this;
        try {
            if (!current) return false;
            const stat = fs.statSync(current);
            if (!stat.isFile()) return false;
            const ext = path.extname(current).toLowerCase();
            return VIDEO_EXTENSIONS.has(ext);
        } catch {
            return false;
        }
    }

    async deleteFile(): Promise<void> {
        if(this.current) await fs.promises.unlink(this.current)
        return Promise.resolve();
    }

}
