#!/usr/bin/env node
import path from "path";
import Video from "../src/video";

async function main() {
    const targetDir = process.argv[2];
    if (!targetDir) {
        console.error(
            "Error: A folder path argument is required.\nUsage: npm run list-videos.ts <folder>",
        );
        process.exit(1);
    }
    const videos = await Video.getVideoList(targetDir);
    // Print only file names
    for (const fullPath of videos) {
        console.log(path.basename(fullPath));
    }
}

main().catch((err) => {
    console.error("Unexpected error:", err);
    process.exit(1);
});
