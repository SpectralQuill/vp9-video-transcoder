#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use std::{
    fs,
    io::{BufRead, BufReader},
    path::PathBuf,
    thread
};
use portable_pty::{CommandBuilder, PtySize, native_pty_system};
use serde::Serialize;
use strip_ansi_escapes::strip;
use tauri::ipc::Channel;

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct TranscodeEvent {
    time: String
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

fn run_ffmpeg_stream(
    input: String,
    output: String,
    on_event: &Channel<TranscodeEvent>,
    _app: tauri::AppHandle
) -> Result<(), String> {

    let input_path = PathBuf::from(input);
    let output_path = PathBuf::from(output);

    let pty_system = native_pty_system();
    let pair = pty_system.openpty(PtySize { rows: 24, cols: 80, pixel_width: 0, pixel_height: 0 }).map_err(|e| e.to_string())?;

    let mut cmd1 = CommandBuilder::new("ffmpeg");
    cmd1.args(&[
        "-i",
        input_path.to_str().unwrap(),
        "-vf","scale=-1:720",
        "-c:v","libvpx-vp9",
        "-b:v","0",
        "-crf","30",
        "-cpu-used","1",
        "-row-mt","1",
        "-tile-columns","1",
        "-threads","8",
        "-pass","1",
        "-an",
        "-f","mp4",
        if cfg!(windows) { "NUL" } else { "/dev/null" }
    ]);

    let mut child1 = pair.slave.spawn_command(cmd1).map_err(|e| e.to_string())?;

    let reader1 = BufReader::new(pair.master.try_clone_reader().map_err(|e| e.to_string())?);

    for line in reader1.lines() {
        if let Ok(text) = line {
            println!("{}", text);
            if text.contains("frame=") || text.contains("time=") {
                let stripped = strip(text.as_bytes()).unwrap_or_else(|_| text.as_bytes().to_vec());
                let cleaned = String::from_utf8(stripped).unwrap_or(text.clone());
                on_event.send(TranscodeEvent {
                    time: cleaned
                }).unwrap();
            }
        }
    }

    child1.wait().map_err(|e| e.to_string())?;

    let pair2 = pty_system.openpty(PtySize { rows: 24, cols: 80, pixel_width: 0, pixel_height: 0 }).map_err(|e| e.to_string())?;

    let mut cmd2 = CommandBuilder::new("ffmpeg");
    cmd2.args(&[
        "-i",
        input_path.to_str().unwrap(),
        "-vf","scale=-1:720",
        "-c:v","libvpx-vp9",
        "-b:v","0",
        "-crf","30",
        "-cpu-used","1",
        "-row-mt","1",
        "-tile-columns","1",
        "-threads","8",
        "-pass","2",
        "-c:a","aac",
        "-b:a","128k",
        output_path.to_str().unwrap()
    ]);

    let mut child2 = pair2.slave.spawn_command(cmd2).map_err(|e| e.to_string())?;

    let reader2 = BufReader::new(pair2.master.try_clone_reader().map_err(|e| e.to_string())?);

    for line in reader2.lines() {
        if let Ok(text) = line {
            println!("{}", text);
            if text.contains("frame=") || text.contains("time=") {
                let stripped = strip(text.as_bytes()).unwrap_or_else(|_| text.as_bytes().to_vec());
                let cleaned = String::from_utf8(stripped).unwrap_or(text.clone());
                on_event.send(TranscodeEvent {
                    time: cleaned
                }).unwrap();
            }
        }
    }

    child2.wait().map_err(|e| e.to_string())?;


    Ok(())
}

#[tauri::command]
fn transcode_vp9(
    input: String,
    output: String,
    on_event: Channel<TranscodeEvent>,
    app: tauri::AppHandle,
) -> Result<(), String> {

    thread::spawn(move || {

        let _ = run_ffmpeg_stream(input, output, &on_event, app.clone());

    });

    Ok(())
}

#[tauri::command]
fn transcode_vp9_batch(
    jobs: Vec<(String, String)>,
    on_event: Channel<TranscodeEvent>,
    app: tauri::AppHandle,
) -> Result<(), String> {

    thread::spawn(move || {

        for (input, output) in jobs {
            let _ = run_ffmpeg_stream(input, output, &on_event, app.clone());
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
