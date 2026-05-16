use crate::tools::{resolve_ytdlp, run_command};
use serde::Serialize;

#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct VideoMetadata {
    pub title: String,
    pub duration: f64,
    pub width: Option<u32>,
    pub height: Option<u32>,
    pub video_id: String,
}

#[tauri::command]
pub fn get_video_metadata(url: String) -> Result<VideoMetadata, String> {
    let ytdlp = resolve_ytdlp()?;
    let output = run_command(&ytdlp, &["--dump-json", "--no-playlist", &url])?;
    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("メタデータ取得に失敗:\n{stderr}"));
    }

    let json_str = String::from_utf8_lossy(&output.stdout);
    let value: serde_json::Value =
        serde_json::from_str(&json_str).map_err(|e| format!("JSON 解析エラー: {e}"))?;

    let title = value
        .get("title")
        .and_then(|v| v.as_str())
        .unwrap_or("Unknown")
        .to_string();
    let duration = value.get("duration").and_then(|v| v.as_f64()).unwrap_or(0.0);
    let video_id = value
        .get("id")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string();
    let width = value.get("width").and_then(|v| v.as_u64()).map(|v| v as u32);
    let height = value
        .get("height")
        .and_then(|v| v.as_u64())
        .map(|v| v as u32);

    Ok(VideoMetadata {
        title,
        duration,
        width,
        height,
        video_id,
    })
}
