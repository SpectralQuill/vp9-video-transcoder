#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use std::{
    fs,
    path::PathBuf,
    process::Command,
    thread,
};

use serde::Serialize;
use tauri::Emitter;

#[derive(Serialize, Clone)]
struct ProgressEvent {
    file: String,
    percent: u8,
}

#[tauri::command]
async fn get_video_list(folder: String) -> Result<Vec<String>, String> {
    let path = PathBuf::from(folder);
    if !path.is_dir() {
        return Err(format!("Not a directory: {:?}", path));
    }

    let mut videos = Vec::new();
    let extensions = ["mp4", "mkv", "webm", "mov", "avi", "flv", "wmv", "m4v"];
    for entry in fs::read_dir(path).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();
        if path.is_file() {
            if let Some(ext) = path.extension() {
                if extensions.contains(&ext.to_str().unwrap_or_default()) {
                    videos.push(path.to_string_lossy().to_string());
                }
            }
        }
    }

    Ok(videos)
}

#[tauri::command]
fn transcode_vp9(
    input: String,
    output: String,
    app_handle: tauri::AppHandle,
) -> Result<(), String> {
    let input_path = PathBuf::from(input);
    let output_path = PathBuf::from(output);

    thread::spawn(move || {
        let status = Command::new("ffmpeg")
            .args(&[
                "-i",
                input_path.to_str().unwrap(),
                "-vf",
                "scale=-1:720",
                "-c:v",
                "libvpx-vp9",
                "-b:v",
                "0",
                "-crf",
                "30",
                "-cpu-used",
                "1",
                "-row-mt",
                "1",
                "-tile-columns",
                "1",
                "-threads",
                "8",
                "-pass",
                "1",
                "-an",
                "-f",
                "mp4",
                if cfg!(windows) { "NUL" } else { "/dev/null" },
            ])
            .status()
            .expect("Failed to run ffmpeg pass1");

        if !status.success() {
            println!("Pass 1 failed");
            return;
        }

        let status2 = Command::new("ffmpeg")
            .args(&[
                "-i",
                input_path.to_str().unwrap(),
                "-vf",
                "scale=-1:720",
                "-c:v",
                "libvpx-vp9",
                "-b:v",
                "0",
                "-crf",
                "30",
                "-cpu-used",
                "1",
                "-row-mt",
                "1",
                "-tile-columns",
                "1",
                "-threads",
                "8",
                "-pass",
                "2",
                "-c:a",
                "aac",
                "-b:a",
                "128k",
                output_path.to_str().unwrap(),
            ])
            .status()
            .expect("Failed to run ffmpeg pass2");

        if status2.success() {
            let _ = app_handle.emit(
                "transcode-progress",
                ProgressEvent {
                    file: output_path.to_string_lossy().to_string(),
                    percent: 100,
                },
            );
        }
    });

    Ok(())
}

#[tauri::command]
fn transcode_vp9_batch(
    jobs: Vec<(String, String)>,
    app_handle: tauri::AppHandle,
) -> Result<(), String> {
    thread::spawn(move || {
        let total = jobs.len();
        for (idx, (input, output)) in jobs.into_iter().enumerate() {
            println!("Encoding {} of {}: {}", idx + 1, total, input);

            let _ = Command::new("ffmpeg")
                .args(&[
                    "-i",
                    &input,
                    "-vf",
                    "scale=-1:720",
                    "-c:v",
                    "libvpx-vp9",
                    "-b:v",
                    "0",
                    "-crf",
                    "30",
                    "-cpu-used",
                    "1",
                    "-row-mt",
                    "1",
                    "-tile-columns",
                    "1",
                    "-threads",
                    "8",
                    "-pass",
                    "1",
                    "-an",
                    "-f",
                    "mp4",
                    if cfg!(windows) { "NUL" } else { "/dev/null" },
                ])
                .status()
                .expect("ffmpeg pass1 failed");

            let _ = Command::new("ffmpeg")
                .args(&[
                    "-i",
                    &input,
                    "-vf",
                    "scale=-1:720",
                    "-c:v",
                    "libvpx-vp9",
                    "-b:v",
                    "0",
                    "-crf",
                    "30",
                    "-cpu-used",
                    "1",
                    "-row-mt",
                    "1",
                    "-tile-columns",
                    "1",
                    "-threads",
                    "8",
                    "-pass",
                    "2",
                    "-c:a",
                    "aac",
                    "-b:a",
                    "128k",
                    &output,
                ])
                .status()
                .expect("ffmpeg pass2 failed");

            let percent = ((idx + 1) * 100 / total) as u8;
            let _ = app_handle.emit(
                "transcode-progress",
                ProgressEvent {
                    file: output.clone(),
                    percent,
                },
            );
        }
    });

    Ok(())
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            get_video_list,
            transcode_vp9,
            transcode_vp9_batch
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
