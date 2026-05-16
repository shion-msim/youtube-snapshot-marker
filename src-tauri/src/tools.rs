use std::path::{Path, PathBuf};
use std::process::Command;

const YTDLP_NAMES: &[&str] = &["yt-dlp", "yt-dlp.exe"];
const FFMPEG_NAMES: &[&str] = &["ffmpeg", "ffmpeg.exe"];

pub fn resolve_ytdlp() -> Result<PathBuf, String> {
    resolve_executable("yt-dlp", YTDLP_NAMES)
}

pub fn resolve_ffmpeg() -> Result<PathBuf, String> {
    resolve_executable("ffmpeg", FFMPEG_NAMES)
}

fn resolve_executable(sidecar_base: &str, path_names: &[&str]) -> Result<PathBuf, String> {
    if let Ok(path) = sidecar_path(sidecar_base) {
        if path.exists() {
            return Ok(path);
        }
    }

    for name in path_names {
        if let Some(path) = find_on_path(name) {
            return Ok(path);
        }
    }

    Err(format!(
        "{sidecar_base} が見つかりません。PATH に追加するか、src-tauri/binaries/ に配置してください。"
    ))
}

fn sidecar_path(base: &str) -> Result<PathBuf, String> {
    let manifest_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    let triple = "x86_64-pc-windows-msvc";
    let candidates = [
        manifest_dir.join("binaries").join(format!("{base}-{triple}.exe")),
        manifest_dir.join("binaries").join(format!("{base}.exe")),
    ];
    for path in candidates {
        if path.exists() {
            return Ok(path);
        }
    }
    Err("sidecar not in binaries".into())
}

fn find_on_path(name: &str) -> Option<PathBuf> {
    let output = Command::new("where").arg(name).output().ok()?;
    if !output.status.success() {
        return None;
    }
    let stdout = String::from_utf8_lossy(&output.stdout);
    stdout
        .lines()
        .map(str::trim)
        .find(|line| !line.is_empty())
        .map(PathBuf::from)
}

pub fn work_dir_for(video_id: &str) -> PathBuf {
    std::env::temp_dir()
        .join("youtube-snapshot-marker")
        .join(video_id)
}

pub fn ensure_dir(path: &Path) -> Result<(), String> {
    std::fs::create_dir_all(path).map_err(|e| e.to_string())
}

pub fn run_command(cmd: &Path, args: &[&str]) -> Result<std::process::Output, String> {
    Command::new(cmd)
        .args(args)
        .output()
        .map_err(|e| format!("{} の実行に失敗: {e}", cmd.display()))
}
