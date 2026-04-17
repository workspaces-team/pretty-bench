export type ChartType = "bar" | "grouped-bar" | "line";
export type SpecFormat = "json" | "yaml" | "toml";

export interface ChartSeries {
  name: string;
  values: number[];
  color?: string;
}

export interface YAxisOptions {
  min?: number;
  max?: number;
}

export interface ChartSpec {
  version: 1;
  type: ChartType;
  title: string;
  subtitle?: string;
  unit?: string;
  width?: number;
  height?: number;
  labels: string[];
  series: ChartSeries[];
  yAxis?: YAxisOptions;
}

export interface RenderOptions {
  input: string;
  output: string;
  binaryPath?: string;
  bindingPath?: string;
}

export interface ValidateOptions {
  input: string;
  binaryPath?: string;
  bindingPath?: string;
}

export interface InitOptions {
  output: string;
  type?: ChartType;
  format?: SpecFormat;
  force?: boolean;
}

export declare function resolveNativeBindingPath(options?: { binaryPath?: string; bindingPath?: string }): string;
export declare function formatFromPath(filePath: string): SpecFormat;
export declare function serializeTemplate(spec: ChartSpec, format?: SpecFormat): string;
export declare function render(options: RenderOptions): Promise<string>;
export declare function validate(options: ValidateOptions): Promise<string>;
export declare function init(options: InitOptions): Promise<string>;
export declare function createTemplate(type?: ChartType): ChartSpec;
