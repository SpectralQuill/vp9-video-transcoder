#!/usr/bin/env node
import * as fs from "fs/promises";
import * as path from "path";
import { Video } from "./video";

/**
 * Retrieves a list of video file paths from the specified directory.
 * @param folderPath Path to the target directory.
 * @returns Promise<string[]> Array of video file paths.
 */
export async function getVideoList(folderPath: string): Promise<string[]> {
    // Get target directory from command line arguments
    const absPath = path.resolve(folderPath);
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
        const { name } = entry;
        if (Video.isVideoFile(name)) videos.push(path.join(absPath, name));
    }
    return videos;
}
