use crate::tools::{ensure_dir, resolve_ytdlp, run_command, work_dir_for};
use std::path::{Path, PathBuf};

pub fn download_video(url: &str, video_id: &str) -> Result<PathBuf, String> {
    let ytdlp = resolve_ytdlp()?;
    let dir = work_dir_for(video_id);
    ensure_dir(&dir)?;

    let output_template = dir.join("%(id)s.%(ext)s");
    let output_str = output_template.to_string_lossy();

    let args = [
        "-f",
        "bv*+ba/b",
        "--merge-output-format",
        "mp4",
        "--no-playlist",
        "-o",
        &output_str,
        url,
    ];

    let output = run_command(&ytdlp, &args)?;
    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("動画の取得に失敗しました:\n{stderr}"));
    }

    find_downloaded_file(&dir, video_id)
}

fn find_downloaded_file(dir: &Path, video_id: &str) -> Result<PathBuf, String> {
    let expected = dir.join(format!("{video_id}.mp4"));
    if expected.exists() {
        return Ok(expected);
    }

    let entries = std::fs::read_dir(dir).map_err(|e| e.to_string())?;
    for entry in entries.flatten() {
        let path = entry.path();
        if path.is_file() {
            if let Some(ext) = path.extension() {
                let ext = ext.to_string_lossy().to_lowercase();
                if ext == "mp4" || ext == "mkv" || ext == "webm" {
                    return Ok(path);
                }
            }
        }
    }

    Err("ダウンロードした動画ファイルが見つかりません".into())
}
