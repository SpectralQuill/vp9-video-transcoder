import csv from "csv-parser";
import FFmpeg from "../src/ffmpeg";
import fs from "fs";
import path from "path";
import Video from "../src/video";

interface EpisodeRecords {
    [code: string]: string;
}

/**
 * Converts a CSV file into a JSON object.
 * @param inputPath Path to the CSV file
 * @param keyHeader The header name for keys
 * @param valueHeader The header name for values
 * @returns Promise<Record<string, string>>
 */
async function csvToJson(
    inputPath: string,
    keyHeader: string,
    valueHeader: string,
): Promise<Record<string, string>> {
    return new Promise((resolve, reject) => {
        const result: Record<string, string> = {};
        fs.createReadStream(path.resolve(inputPath))
            .pipe(csv())
            .on("data", (row) => {
                const recordKey = row[keyHeader],
                    recordValue = row[valueHeader];
                if (recordKey !== undefined && recordValue !== undefined)
                    result[recordKey] = recordValue;
            })
            .on("end", () => {
                resolve(result);
            })
            .on("error", (err) => reject(err));
    });
}

async function main() {
    const seasonCode = "06",
        rawRoot = `C:/Users/giant/Downloads/Torrents/Adventure Time (2010) Season 1-10 S01-S10 + Extras (1080p BluRay x265 HEVC 10bit AAC 2.0 ImE)/Season ${seasonCode}`,
        convertedRoot = `C:/Users/giant/Downloads/Torrents/Adventure Time (2010) Season 1-10 S01-S10 + Extras (1080p BluRay x265 HEVC 10bit AAC 2.0 ImE)/Season ${seasonCode} - Converted`,
        episodeData = await csvToJson("dev/episodes.csv", "Code", "Title"),
        rawVideoPaths = await Video.getVideoList(rawRoot),
        convertedVideoPaths = await Video.getVideoList(convertedRoot),
        rawVideoNames = rawVideoPaths.map((fp) => path.basename(fp)),
        convertedVideoNames = convertedVideoPaths.map((fp) =>
            path.basename(fp),
        ),
        videosToConvert: EpisodeRecords = {};
    for (const code in episodeData) {
        const rawIndex = rawVideoNames.findIndex((name) => name.includes(code)),
            convertedIndex = convertedVideoNames.findIndex((name) =>
                name.includes(code),
            ),
            hasRaw = rawIndex !== -1,
            hasConverted = convertedIndex !== -1;
        if (hasConverted) {
            convertedVideoPaths.splice(convertedIndex, 1);
            convertedVideoNames.splice(convertedIndex, 1);
            continue;
        }
        if (!hasRaw) continue;
        const title = episodeData[code],
            rawPath = rawVideoPaths[rawIndex],
            convertedName = `${code} - ${title}.mp4`,
            convertedPath = path.join(convertedRoot, convertedName);
        videosToConvert[rawPath] = convertedPath;
        rawVideoNames.splice(rawIndex, 1);
        rawVideoPaths.splice(rawIndex, 1);
    }
    await FFmpeg.transcodeVp9Batch(videosToConvert);
}

main().catch((err) => {
    console.error("Unexpected error:", err);
    process.exit(1);
});
