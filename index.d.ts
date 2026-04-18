export type ChartType = "bar" | "grouped-bar" | "line";

export interface ChartSpec {
  version: 1;
  type: ChartType;
  title: string;
  labels: string[];
  series: {
    name: string;
    values: number[];
    color?: string;
  }[];
  subtitle?: string;
  unit?: string;
  width?: number;
  height?: number;
  yAxis?: {
    min?: number;
    max?: number;
  };
}

export declare function render(input: string, output: string): Promise<void>;
export declare function validate(input: string): Promise<void>;
