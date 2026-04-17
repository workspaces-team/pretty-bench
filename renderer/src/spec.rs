use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "kebab-case")]
pub enum ChartType {
    Bar,
    GroupedBar,
    Line,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct Series {
    pub name: String,
    pub values: Vec<f64>,
    #[serde(default)]
    pub color: Option<String>,
}

#[derive(Debug, Clone, Deserialize, Serialize, Default)]
pub struct YAxis {
    #[serde(default)]
    pub min: Option<f64>,
    #[serde(default)]
    pub max: Option<f64>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct ChartSpec {
    pub version: u8,
    #[serde(rename = "type")]
    pub chart_type: ChartType,
    pub title: String,
    #[serde(default)]
    pub subtitle: Option<String>,
    #[serde(default)]
    pub unit: Option<String>,
    #[serde(default)]
    pub width: Option<u32>,
    #[serde(default)]
    pub height: Option<u32>,
    pub labels: Vec<String>,
    pub series: Vec<Series>,
    #[serde(default, rename = "yAxis")]
    pub y_axis: YAxis,
}

impl ChartSpec {
    pub fn width(&self) -> u32 {
        self.width.unwrap_or(1280)
    }

    pub fn height(&self) -> u32 {
        self.height.unwrap_or(720)
    }

    pub fn validate(&self) -> Vec<String> {
        let mut errors = Vec::new();

        if self.version != 1 {
            errors.push("version must be 1".to_string());
        }
        if self.title.trim().is_empty() {
            errors.push("title must be non-empty".to_string());
        }
        if self.labels.is_empty() {
            errors.push("labels must contain at least one item".to_string());
        }
        if self.series.is_empty() {
            errors.push("series must contain at least one item".to_string());
        }
        if matches!(self.chart_type, ChartType::Bar) && self.series.len() != 1 {
            errors.push("bar charts require exactly one series".to_string());
        }

        for (index, label) in self.labels.iter().enumerate() {
            if label.trim().is_empty() {
                errors.push(format!("labels[{index}] must be non-empty"));
            }
        }

        for (series_index, series) in self.series.iter().enumerate() {
            if series.name.trim().is_empty() {
                errors.push(format!("series[{series_index}].name must be non-empty"));
            }
            if series.values.len() != self.labels.len() {
                errors.push(format!(
                    "series[{series_index}].values length ({}) must match labels length ({})",
                    series.values.len(),
                    self.labels.len()
                ));
            }
            for (value_index, value) in series.values.iter().enumerate() {
                if !value.is_finite() {
                    errors.push(format!(
                        "series[{series_index}].values[{value_index}] must be a finite number"
                    ));
                }
            }
            if let Some(color) = &series.color {
                if !is_hex_color(color) {
                    errors.push(format!(
                        "series[{series_index}].color must be a 6-digit hex color like #2E86AB"
                    ));
                }
            }
        }

        if let (Some(min), Some(max)) = (self.y_axis.min, self.y_axis.max) {
            if min >= max {
                errors.push("yAxis.min must be less than yAxis.max".to_string());
            }
        }

        errors
    }
}

fn is_hex_color(value: &str) -> bool {
    let bytes = value.as_bytes();
    if bytes.len() != 7 || bytes[0] != b'#' {
        return false;
    }
    bytes[1..].iter().all(|byte| byte.is_ascii_hexdigit())
}

#[cfg(test)]
mod tests {
    use super::{ChartSpec, ChartType, Series, YAxis};

    fn valid_spec(chart_type: ChartType) -> ChartSpec {
        ChartSpec {
            version: 1,
            chart_type,
            title: "demo".to_string(),
            subtitle: None,
            unit: Some("ops/sec".to_string()),
            width: None,
            height: None,
            labels: vec!["a".to_string(), "b".to_string()],
            series: vec![Series {
                name: "main".to_string(),
                values: vec![1.0, 2.0],
                color: Some("#2E86AB".to_string()),
            }],
            y_axis: YAxis::default(),
        }
    }

    #[test]
    fn bar_requires_exactly_one_series() {
        let mut spec = valid_spec(ChartType::Bar);
        spec.series.push(Series {
            name: "branch".to_string(),
            values: vec![1.0, 2.0],
            color: None,
        });

        assert!(spec
            .validate()
            .iter()
            .any(|error| error.contains("exactly one series")));
    }

    #[test]
    fn rejects_value_count_mismatch() {
        let mut spec = valid_spec(ChartType::GroupedBar);
        spec.series[0].values = vec![1.0];

        assert!(spec.validate().iter().any(|error| error.contains("length")));
    }
}
