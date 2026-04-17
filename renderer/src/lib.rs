mod render;
mod spec;

use std::fs::File;
use std::io::{BufReader, Read};
use std::path::PathBuf;

use anyhow::{bail, Context, Result as AnyResult};
use napi::bindgen_prelude::Error;
use napi_derive::napi;

use crate::render::render_png;
use crate::spec::ChartSpec;

#[napi(js_name = "validateSpec")]
pub fn validate_spec(input: String) -> napi::Result<String> {
    let input_path = PathBuf::from(input);
    load_and_validate(&input_path).map_err(to_napi_error)?;
    Ok("Spec is valid".to_string())
}

#[napi(js_name = "renderSpec")]
pub fn render_spec(input: String, output: String) -> napi::Result<String> {
    let input_path = PathBuf::from(input);
    let output_path = PathBuf::from(output);
    let spec = load_and_validate(&input_path).map_err(to_napi_error)?;
    render_png(&spec, &output_path).map_err(to_napi_error)?;
    Ok(output_path.display().to_string())
}

fn load_and_validate(path: &PathBuf) -> AnyResult<ChartSpec> {
    let file = File::open(path)
        .with_context(|| format!("failed to open input spec {}", path.display()))?;
    let mut reader = BufReader::new(file);
    let mut buffer = String::new();
    reader
        .read_to_string(&mut buffer)
        .with_context(|| format!("failed to read input spec {}", path.display()))?;
    let spec = parse_spec(path, &buffer)?;
    let errors = spec.validate();
    if !errors.is_empty() {
        bail!("spec validation failed:\n- {}", errors.join("\n- "));
    }
    Ok(spec)
}

fn parse_spec(path: &PathBuf, contents: &str) -> AnyResult<ChartSpec> {
    let extension = path
        .extension()
        .and_then(|value| value.to_str())
        .unwrap_or_default()
        .to_ascii_lowercase();
    match extension.as_str() {
        "json" => serde_json::from_str(contents)
            .with_context(|| format!("failed to parse JSON spec {}", path.display())),
        "yaml" | "yml" => serde_yaml::from_str(contents)
            .with_context(|| format!("failed to parse YAML spec {}", path.display())),
        "toml" => toml::from_str(contents)
            .with_context(|| format!("failed to parse TOML spec {}", path.display())),
        _ => bail!(
            "unsupported spec format for {}. Expected .json, .yaml, .yml, or .toml",
            path.display()
        ),
    }
}

fn to_napi_error(error: anyhow::Error) -> Error {
    Error::from_reason(format!("{error:#}"))
}
