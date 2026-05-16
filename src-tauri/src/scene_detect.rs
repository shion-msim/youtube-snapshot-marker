use crate::download::download_video;
use crate::tools::{resolve_ffmpeg, run_command};
use regex::Regex;
use tauri::{AppHandle, Emitter};

#[derive(Clone, serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct ProgressPayload {
    stage: String,
    message: String,
    current: u32,
    total: u32,
}

#[tauri::command]
pub async fn detect_scenes(
    app: AppHandle,
    url: String,
    video_id: String,
    threshold: f64,
) -> Result<Vec<f64>, String> {
    let _ = app.emit(
        "task-progress",
        ProgressPayload {
            stage: "download".into(),
            message: "動画をダウンロード中…".into(),
            current: 0,
            total: 2,
        },
    );

    let video_path = tauri::async_runtime::spawn_blocking({
        let url = url.clone();
        let video_id = video_id.clone();
        move || download_video(&url, &video_id)
    })
    .await
    .map_err(|e| e.to_string())??;

    let _ = app.emit(
        "task-progress",
        ProgressPayload {
            stage: "detect".into(),
            message: "カットを検出中…".into(),
            current: 1,
            total: 2,
        },
    );

    let timestamps = tauri::async_runtime::spawn_blocking(move || {
        detect_scenes_from_file(&video_path, threshold)
    })
    .await
    .map_err(|e| e.to_string())??;

    let _ = app.emit(
        "task-progress",
        ProgressPayload {
            stage: "done".into(),
            message: format!("{} 件のカットを検出", timestamps.len()),
            current: 2,
            total: 2,
        },
    );

    Ok(timestamps)
}

fn detect_scenes_from_file(video_path: &std::path::Path, threshold: f64) -> Result<Vec<f64>, String> {
    let ffmpeg = resolve_ffmpeg()?;
    let filter = format!("select='gt(scene,{threshold})',showinfo");
    let path_str = video_path.to_string_lossy();

    let output = run_command(
        &ffmpeg,
        &[
            "-hide_banner",
            "-i",
            &path_str,
            "-filter:v",
            &filter,
            "-f",
            "null",
            "-",
        ],
    )?;

    let combined = format!(
        "{}{}",
        String::from_utf8_lossy(&output.stdout),
        String::from_utf8_lossy(&output.stderr)
    );

    let re = Regex::new(r"pts_time:([0-9.]+)").map_err(|e| e.to_string())?;
    let mut times: Vec<f64> = re
        .captures_iter(&combined)
        .filter_map(|cap| cap.get(1)?.as_str().parse().ok())
        .collect();

    times.sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));
    times.dedup_by(|a, b| (*a - *b).abs() < 0.3);

    Ok(times)
}
