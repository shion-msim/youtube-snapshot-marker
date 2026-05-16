use crate::download::download_video;
use crate::tools::{resolve_ffmpeg, run_command};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tauri::{AppHandle, Emitter};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExportMarker {
    pub seconds: f64,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct ProgressPayload {
    stage: String,
    message: String,
    current: u32,
    total: u32,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ExportResult {
    pub paths: Vec<String>,
}

fn format_timestamp(seconds: f64) -> String {
    let total_ms = (seconds * 1000.0).round() as u64;
    let ms = total_ms % 1000;
    let total_s = total_ms / 1000;
    let s = total_s % 60;
    let total_m = total_s / 60;
    let m = total_m % 60;
    let h = total_m / 60;
    format!("{h:02}-{m:02}-{s:02}-{ms:03}")
}

#[tauri::command]
pub async fn export_snapshots(
    app: AppHandle,
    url: String,
    video_id: String,
    markers: Vec<ExportMarker>,
    output_dir: String,
) -> Result<ExportResult, String> {
    if markers.is_empty() {
        return Err("マーカーがありません".into());
    }

    let mut sorted: Vec<ExportMarker> = markers;
    sorted.sort_by(|a, b| {
        a.seconds
            .partial_cmp(&b.seconds)
            .unwrap_or(std::cmp::Ordering::Equal)
    });

    let total_steps = sorted.len() as u32 + 1;

    let _ = app.emit(
        "task-progress",
        ProgressPayload {
            stage: "download".into(),
            message: "最高画質で動画を取得中…".into(),
            current: 0,
            total: total_steps,
        },
    );

    let video_path = tauri::async_runtime::spawn_blocking({
        let url = url.clone();
        let video_id = video_id.clone();
        move || download_video(&url, &video_id)
    })
    .await
    .map_err(|e| e.to_string())??;

    let ffmpeg = resolve_ffmpeg()?;
    let output_base = PathBuf::from(&output_dir);
    let video_str = video_path.to_string_lossy().to_string();
    let mut paths: Vec<String> = Vec::new();

    for (index, marker) in sorted.iter().enumerate() {
        let step = index as u32 + 1;
        let seq = index + 1;
        let ts_label = format_timestamp(marker.seconds);
        let filename = format!("{seq:03}_{video_id}_{ts_label}.png");
        let out_path = output_base.join(&filename);
        let out_str = out_path.to_string_lossy().to_string();
        let ss = format!("{:.3}", marker.seconds);

        let _ = app.emit(
            "task-progress",
            ProgressPayload {
                stage: "export".into(),
                message: format!("{seq}/{total_steps} {filename}"),
                current: step,
                total: total_steps,
            },
        );

        let ffmpeg_path = ffmpeg.clone();
        let video_str_clone = video_str.clone();
        let out_str_clone = out_str.clone();
        let ss_clone = ss.clone();

        let result = tauri::async_runtime::spawn_blocking(move || {
            run_command(
                &ffmpeg_path,
                &[
                    "-hide_banner",
                    "-loglevel",
                    "error",
                    "-ss",
                    &ss_clone,
                    "-i",
                    &video_str_clone,
                    "-frames:v",
                    "1",
                    "-y",
                    &out_str_clone,
                ],
            )
        })
        .await
        .map_err(|e| e.to_string())??;

        if !result.status.success() {
            let stderr = String::from_utf8_lossy(&result.stderr);
            return Err(format!("フレーム抽出失敗 ({filename}):\n{stderr}"));
        }

        paths.push(out_str);
    }

    let _ = app.emit(
        "task-progress",
        ProgressPayload {
            stage: "done".into(),
            message: format!("{} 枚を書き出しました", paths.len()),
            current: total_steps,
            total: total_steps,
        },
    );

    Ok(ExportResult { paths })
}
