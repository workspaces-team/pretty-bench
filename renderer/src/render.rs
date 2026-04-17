use anyhow::{bail, Result};
use plotters::coord::types::RangedCoordf64;
use plotters::prelude::*;

use crate::spec::{ChartSpec, ChartType, Series};

const PALETTE: [RGBColor; 6] = [
    RGBColor(46, 134, 171),
    RGBColor(91, 142, 125),
    RGBColor(244, 162, 89),
    RGBColor(188, 75, 81),
    RGBColor(111, 76, 91),
    RGBColor(72, 149, 239),
];

pub fn render_png(spec: &ChartSpec, output_path: &std::path::Path) -> Result<()> {
    if let Some(parent) = output_path.parent() {
        std::fs::create_dir_all(parent)?;
    }

    let backend = BitMapBackend::new(output_path, (spec.width(), spec.height()));
    let root = backend.into_drawing_area();
    root.fill(&WHITE)?;

    let (header_area, chart_area) = root.split_vertically(96);
    draw_header(spec, &header_area)?;

    match spec.chart_type {
        ChartType::Bar => render_bar_chart(spec, &chart_area)?,
        ChartType::GroupedBar => render_grouped_bar_chart(spec, &chart_area)?,
        ChartType::Line => render_line_chart(spec, &chart_area)?,
    }

    root.present()?;
    Ok(())
}

fn draw_header(
    spec: &ChartSpec,
    area: &DrawingArea<BitMapBackend<'_>, plotters::coord::Shift>,
) -> Result<()> {
    area.fill(&WHITE)?;
    area.draw(&Text::new(
        spec.title.clone(),
        (24, 30),
        ("sans-serif", 32).into_font().style(FontStyle::Bold),
    ))?;

    if let Some(subtitle) = &spec.subtitle {
        area.draw(&Text::new(
            subtitle.clone(),
            (24, 66),
            ("sans-serif", 18).into_font().color(&RGBColor(90, 90, 90)),
        ))?;
    }

    Ok(())
}

fn render_bar_chart(
    spec: &ChartSpec,
    area: &DrawingArea<BitMapBackend<'_>, plotters::coord::Shift>,
) -> Result<()> {
    let series = spec
        .series
        .first()
        .ok_or_else(|| anyhow::anyhow!("bar charts require exactly one series"))?;

    let (y_min, y_max) = value_range(spec)?;
    let labels = spec.labels.clone();
    let last_index = labels.len().saturating_sub(1);
    let mut chart = ChartBuilder::on(area)
        .margin_top(16)
        .margin_right(24)
        .margin_left(72)
        .margin_bottom(72)
        .x_label_area_size(56)
        .y_label_area_size(64)
        .build_cartesian_2d(-0.5f64..(last_index as f64 + 0.5), y_min..y_max)?;

    configure_mesh(&mut chart, spec, labels)?;
    let color = series_color(series, 0)?;
    chart
        .draw_series(series.values.iter().enumerate().map(|(index, value)| {
            let center = index as f64;
            Rectangle::new(
                [(center - 0.35, 0.0), (center + 0.35, *value)],
                color.filled(),
            )
        }))?
        .label(series.name.clone())
        .legend(move |(x, y)| Rectangle::new([(x, y - 5), (x + 16, y + 5)], color.filled()));

    draw_legend(&mut chart)?;
    Ok(())
}

fn render_grouped_bar_chart(
    spec: &ChartSpec,
    area: &DrawingArea<BitMapBackend<'_>, plotters::coord::Shift>,
) -> Result<()> {
    let (y_min, y_max) = value_range(spec)?;
    let labels = spec.labels.clone();
    let last_index = labels.len().saturating_sub(1);
    let mut chart = ChartBuilder::on(area)
        .margin_top(16)
        .margin_right(24)
        .margin_left(72)
        .margin_bottom(72)
        .x_label_area_size(56)
        .y_label_area_size(64)
        .build_cartesian_2d(-0.5f64..(last_index as f64 + 0.5), y_min..y_max)?;

    configure_mesh(&mut chart, spec, labels)?;
    let series_count = spec.series.len().max(1);
    let group_width = 0.8f64;
    let bar_width = group_width / series_count as f64;
    let left_edge = -group_width / 2.0;

    for (series_index, series) in spec.series.iter().enumerate() {
        let color = series_color(series, series_index)?;
        chart
            .draw_series(
                series
                    .values
                    .iter()
                    .enumerate()
                    .map(|(label_index, value)| {
                        let x0 = label_index as f64 + left_edge + series_index as f64 * bar_width;
                        let x1 = x0 + bar_width;
                        Rectangle::new([(x0, 0.0), (x1, *value)], color.filled())
                    }),
            )?
            .label(series.name.clone())
            .legend(move |(x, y)| Rectangle::new([(x, y - 5), (x + 16, y + 5)], color.filled()));
    }

    draw_legend(&mut chart)?;
    Ok(())
}

fn render_line_chart(
    spec: &ChartSpec,
    area: &DrawingArea<BitMapBackend<'_>, plotters::coord::Shift>,
) -> Result<()> {
    let (y_min, y_max) = value_range(spec)?;
    let labels = spec.labels.clone();
    let last_index = labels.len().saturating_sub(1);
    let mut chart = ChartBuilder::on(area)
        .margin_top(16)
        .margin_right(24)
        .margin_left(72)
        .margin_bottom(72)
        .x_label_area_size(56)
        .y_label_area_size(64)
        .build_cartesian_2d(0f64..last_index.max(1) as f64, y_min..y_max)?;

    configure_mesh(&mut chart, spec, labels)?;

    for (series_index, series) in spec.series.iter().enumerate() {
        let color = series_color(series, series_index)?;
        let data: Vec<(f64, f64)> = series
            .values
            .iter()
            .enumerate()
            .map(|(index, value)| (index as f64, *value))
            .collect();

        chart
            .draw_series(LineSeries::new(data.clone(), color.stroke_width(3)))?
            .label(series.name.clone())
            .legend(move |(x, y)| {
                PathElement::new(vec![(x, y), (x + 16, y)], color.stroke_width(3))
            });

        chart.draw_series(
            data.into_iter()
                .map(|point| Circle::new(point, 4, color.filled())),
        )?;
    }

    draw_legend(&mut chart)?;
    Ok(())
}

fn configure_mesh<'a, DB: DrawingBackend>(
    chart: &mut ChartContext<'a, DB, Cartesian2d<RangedCoordf64, RangedCoordf64>>,
    spec: &ChartSpec,
    labels: Vec<String>,
) -> Result<()>
where
    <DB as DrawingBackend>::ErrorType: 'static,
{
    let label_count = labels.len();
    let x_labels = label_count.min(12).max(1);
    chart
        .configure_mesh()
        .disable_x_mesh()
        .disable_y_mesh()
        .light_line_style(RGBColor(220, 220, 220))
        .bold_line_style(RGBColor(200, 200, 200))
        .axis_desc_style(("sans-serif", 18).into_font())
        .label_style(("sans-serif", 14).into_font())
        .x_labels(x_labels)
        .y_desc(spec.unit.clone().unwrap_or_default())
        .x_label_formatter(&move |value: &f64| {
            let index = value
                .round()
                .clamp(0.0, label_count.saturating_sub(1) as f64) as usize;
            labels.get(index).cloned().unwrap_or_default()
        })
        .draw()?;
    Ok(())
}

fn draw_legend<'a, DB: DrawingBackend + 'a>(
    chart: &mut ChartContext<'a, DB, Cartesian2d<RangedCoordf64, RangedCoordf64>>,
) -> Result<()>
where
    <DB as DrawingBackend>::ErrorType: 'static,
{
    chart
        .configure_series_labels()
        .border_style(RGBColor(210, 210, 210))
        .background_style(WHITE.mix(0.9))
        .label_font(("sans-serif", 14).into_font())
        .position(SeriesLabelPosition::UpperRight)
        .draw()?;
    Ok(())
}

fn value_range(spec: &ChartSpec) -> Result<(f64, f64)> {
    let mut min_value = spec
        .series
        .iter()
        .flat_map(|series| series.values.iter().copied())
        .fold(f64::INFINITY, |acc, value| acc.min(value));
    let mut max_value = spec
        .series
        .iter()
        .flat_map(|series| series.values.iter().copied())
        .fold(f64::NEG_INFINITY, |acc, value| acc.max(value));

    if !min_value.is_finite() || !max_value.is_finite() {
        bail!("spec must contain at least one finite value");
    }

    min_value = spec.y_axis.min.unwrap_or(min_value.min(0.0));
    max_value = spec.y_axis.max.unwrap_or(max_value.max(0.0));

    if min_value >= max_value {
        max_value = min_value + 1.0;
    }

    let padding = (max_value - min_value).abs() * 0.1;
    Ok((min_value - padding, max_value + padding))
}

fn series_color(series: &Series, index: usize) -> Result<RGBColor> {
    if let Some(color) = &series.color {
        return parse_hex_color(color);
    }
    Ok(PALETTE[index % PALETTE.len()])
}

fn parse_hex_color(value: &str) -> Result<RGBColor> {
    if value.len() != 7 || !value.starts_with('#') {
        bail!("invalid color {value}; expected #RRGGBB");
    }
    let red = u8::from_str_radix(&value[1..3], 16)?;
    let green = u8::from_str_radix(&value[3..5], 16)?;
    let blue = u8::from_str_radix(&value[5..7], 16)?;
    Ok(RGBColor(red, green, blue))
}
