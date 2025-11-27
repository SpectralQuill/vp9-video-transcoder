#!/usr/bin/env node
import path from "path";
import { getVideoList } from "../src/get-video-list";

async function main() {
    const targetDir = process.argv[2];
    if (!targetDir) {
        console.error("Error: A folder path argument is required.\nUsage: tsx scripts/list-videos.ts <folder>");
        process.exit(1);
    }
    const videos = await getVideoList(targetDir);
    // Print only file names
    for (const fullPath of videos) {
        console.log(path.basename(fullPath));
    }
}

main().catch(err => {
    console.error("Unexpected error:", err);
    process.exit(1);
});
