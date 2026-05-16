use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tauri::Manager;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MarkerData {
    pub id: String,
    pub seconds: f64,
    pub source: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectData {
    pub url: String,
    pub video_id: String,
    pub markers: Vec<MarkerData>,
}

fn project_path(app: &tauri::AppHandle, video_id: &str) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?
        .join("projects");
    std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir.join(format!("{video_id}.json")))
}

#[tauri::command]
pub fn save_project(app: tauri::AppHandle, project: ProjectData) -> Result<(), String> {
    let path = project_path(&app, &project.video_id)?;
    let json = serde_json::to_string_pretty(&project).map_err(|e| e.to_string())?;
    std::fs::write(path, json).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn load_project(app: tauri::AppHandle, video_id: String) -> Result<Option<ProjectData>, String> {
    let path = project_path(&app, &video_id)?;
    if !path.exists() {
        return Ok(None);
    }
    let content = std::fs::read_to_string(path).map_err(|e| e.to_string())?;
    let project: ProjectData = serde_json::from_str(&content).map_err(|e| e.to_string())?;
    Ok(Some(project))
}
