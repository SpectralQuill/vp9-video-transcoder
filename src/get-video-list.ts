#!/usr/bin/env node
import * as fs from "fs/promises";
import * as path from "path";
import { VIDEO_EXTENSIONS } from "./video-extensions";

async function getVideoList(targetDir: string): Promise<string[]> {
    // Get target directory from command line arguments
    const absPath = path.resolve(targetDir);
    let stat;
    try {
        stat = await fs.stat(absPath);
    } catch {
        throw `Error: Path does not exist: ${absPath}`;
    }
    if (!stat.isDirectory()) throw `Error: Not a directory: ${absPath}`
    // Read directory contents
    const
        entries = await fs.readdir(absPath, { withFileTypes: true }),
        videos: string[] = []
    ;
    for (const entry of entries) {
        if (!entry.isFile()) continue;
        const
            { name } = entry,
            ext = path.extname(name).toLowerCase()
        ;
        if (VIDEO_EXTENSIONS.has(ext)) videos.push(path.join(absPath, name));
    }
    return videos;
}

export { VIDEO_EXTENSIONS, getVideoList };
