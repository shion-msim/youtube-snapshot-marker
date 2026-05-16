mod download;
mod export;
mod metadata;
mod project;
mod scene_detect;
mod tools;

use metadata::get_video_metadata;
use project::{load_project, save_project};
use scene_detect::detect_scenes;
use export::export_snapshots;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            get_video_metadata,
            detect_scenes,
            export_snapshots,
            save_project,
            load_project,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
