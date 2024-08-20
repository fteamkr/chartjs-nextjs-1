"use client";

import { useRef } from "react";
import { Chart } from "react-chartjs-2"; // https://github.com/reactchartjs/react-chartjs-2
import { Chart as ChartJS, TimeScale } from "chart.js/auto"; // https://github.com/chartjs/Chart.js
import annotationPlugin from "chartjs-plugin-annotation"; // https://github.com/chartjs/chartjs-plugin-annotation
import zoomPlugin from "chartjs-plugin-zoom"; // https://github.com/chartjs/chartjs-plugin-zoom
import {
  CandlestickController,
  CandlestickElement,
} from "chartjs-chart-financial"; // https://github.com/chartjs/chartjs-chart-financial
import dayjs from "@/utils/dayjs";
import "chartjs-adapter-dayjs-4/dist/chartjs-adapter-dayjs-4.esm"; // https://github.com/bolstycjw/chartjs-adapter-dayjs-4
import type {
  ChartData,
  ChartOptions,
  ChartEvent,
  Point,
  FinancialDataPoint,
} from "chart.js";
import type { LineAnnotationOptions } from "chartjs-plugin-annotation";

const ANNOTAITON_ID = {
  HOVERED_LINE: "hoveredLineAnnotation",
};

const baseAnnotationPlugin = {
  // https://www.chartjs.org/docs/latest/developers/plugins.html
  id: "base_annotation",

  // https://www.chartjs.org/docs/latest/api/interfaces/Plugin.html#afterrender
  afterRender(
    chart: ChartJS,
    args: Record<string, never>,
    options: Record<string, any>
  ) {
    let changed = false;

    const { hover } = options;

    const { value, label } = hover;

    const { content } = label;
    const labelContent =
      typeof content === "function" ? content(value) : content;

    const newAnnotation = {
      // https://www.chartjs.org/chartjs-plugin-annotation/latest/guide/types/line.html
      type: "line",
      id: ANNOTAITON_ID.HOVERED_LINE,
      scaleID: "x",
      value,
      borderColor: "rgb(75, 192, 192)",
      borderWidth: 1,
      display: true,
      label: {
        // https://www.chartjs.org/chartjs-plugin-annotation/latest/guide/types/line.html#label
        content: labelContent,
        display: true,
      },
      animations: {
        numbers: {
          properties: ["x", "x2"],
          type: "number",
        },
      },
    } as LineAnnotationOptions;

    if (chart.options.plugins == null) {
      chart.options.plugins = {
        annotation: {
          annotations: [],
        },
      };
    }

    if (chart.options.plugins.annotation == null) {
      chart.options.plugins.annotation = {
        annotations: [],
      };
    }

    if (chart.options.plugins.annotation.annotations == null) {
      chart.options.plugins.annotation.annotations = [];
    }

    if (Array.isArray(chart.options.plugins.annotation.annotations)) {
      // array
      const matchedIndex =
        chart.options.plugins.annotation.annotations.findIndex(
          ({ id }) => id !== ANNOTAITON_ID.HOVERED_LINE
        );
      if (matchedIndex !== -1) {
        if (
          (
            chart.options.plugins.annotation.annotations[
              matchedIndex
            ] as LineAnnotationOptions
          ).value !== newAnnotation.value
        ) {
          chart.options.plugins.annotation.annotations =
            chart.options.plugins.annotation.annotations.map((a, index) =>
              index === matchedIndex ? newAnnotation : a
            );
          changed = true;
        }
      } else {
        chart.options.plugins.annotation.annotations = [
          ...chart.options.plugins.annotation.annotations,
          newAnnotation,
        ];
        changed = true;
      }
    } else {
      // object
      const matched = chart.options.plugins.annotation.annotations[
        ANNOTAITON_ID.HOVERED_LINE
      ] as LineAnnotationOptions;
      if (matched != null) {
        if (matched.value !== newAnnotation.value) {
          chart.options.plugins.annotation.annotations = {
            ...chart.options.plugins.annotation.annotations,
            [ANNOTAITON_ID.HOVERED_LINE]: newAnnotation,
          };
          changed = true;
        }
      } else {
        chart.options.plugins.annotation.annotations = {
          ...chart.options.plugins.annotation.annotations,
          [ANNOTAITON_ID.HOVERED_LINE]: newAnnotation,
        };
        changed = true;
      }
    }

    if (changed) {
      chart.update();
    }
  },

  // https://www.chartjs.org/docs/latest/api/interfaces/Plugin.html#afterevent
  afterEvent(
    chart: ChartJS,
    args: {
      event: ChartEvent;
      replay: boolean;
      changed?: boolean;
      cancelable: false;
      inChartArea: boolean;
    },
    options: Record<string, any>
  ) {
    const { event } = args;
    if (event.type === "mousemove") {
      // HOVER
      if (
        chart.tooltip?.dataPoints != null &&
        chart.tooltip.dataPoints.length > 0
      ) {
        const { x } = chart.tooltip.dataPoints[0].raw as Point;
        const { annotations } = chart.options?.plugins?.annotation ?? {};

        const { hover } = options;

        let matchedAnnotation;

        if (Array.isArray(annotations)) {
          // array
          matchedAnnotation = annotations.find(
            ({ id }) => id === ANNOTAITON_ID.HOVERED_LINE
          ) as LineAnnotationOptions;
        } else if (
          annotations != null &&
          Object.hasOwn(annotations, ANNOTAITON_ID.HOVERED_LINE)
        ) {
          // object
          matchedAnnotation = annotations[
            ANNOTAITON_ID.HOVERED_LINE
          ] as LineAnnotationOptions;
        }

        if (matchedAnnotation != null && matchedAnnotation.value !== x) {
          matchedAnnotation.value = x;

          if (matchedAnnotation.label != null) {
            const { content } = hover.label;
            matchedAnnotation.label.content =
              typeof content === "function" ? content(x) : content;
          }

          chart.update();

          hover.afterEvent(chart.tooltip.dataPoints[0].raw);
        }
      }
    } else if (event.type === "click") {
      // CLICK
      const { native } = event;
      if (native != null) {
        // https://www.chartjs.org/docs/latest/developers/api.html#getelementsateventformode-e-mode-options-usefinalposition
        const elements = chart.getElementsAtEventForMode(
          native,
          "nearest",
          { intersect: false, axis: "x" },
          true
        );

        if (elements.length > 0) {
          const [firstElement] = elements;
          const { datasetIndex, index } = firstElement;

          const { click } = options;
          click.afterEvent(chart.data.datasets[datasetIndex].data[index]);
        }
      }
    }
  },

  defaults: {
    hover: {
      value: undefined,
      label: {
        content: "",
      },
      afterEvent(data: Point) {},
    },
    click: {
      afterEvent(data: Point) {},
    },
  },
};

// https://www.chartjs.org/docs/latest/developers/axes.html
class BusinessTimeScale extends TimeScale {
  static readonly id = "businessTime";

  static readonly defaults = TimeScale.defaults;

  private _table: {
    from_time: number;
    to_time: number;
    from_pos: number;
    to_pos: number;
  }[] = [];

  private _range: number;

  constructor(chart: ChartJS) {
    super(chart);
  }

  configure(): void {
    super.configure();

    const _dmin = dayjs(this.min);
    const _dmax = dayjs(this.max);
    console.log(_dmin.format(), _dmax.format());

    const diff = Math.ceil(_dmax.diff(_dmin, "day", true));
    const table = Array.from({ length: diff }, (_, index) => {
      const d = _dmin.add(index, "day");
      const weekDay = d.day();
      if (weekDay === 0 || weekDay === 6) {
        return null;
      } else {
        return {
          from_time:
            index === 0 ? _dmin.valueOf() : d.hour(9).startOf("hour").valueOf(),
          to_time:
            index === diff - 1
              ? _dmax.valueOf()
              : d.hour(17).startOf("hour").valueOf(),
        };
      }
    })
      .filter((item) => item != null)
      .reduce(
        (acc, { from_time, to_time }, index) => {
          const prevPos = index === 0 ? 0 : acc[index - 1].to_pos;
          acc.push({
            from_time,
            to_time,
            from_pos: prevPos,
            to_pos: prevPos + to_time - from_time,
          });
          return acc;
        },
        [] as {
          from_time: number;
          to_time: number;
          from_pos: number;
          to_pos: number;
        }[]
      );

    this._table = table;
    this._range = table.length > 0 ? table[table.length - 1].to_pos : NaN;

    console.log(this._table, this._range);
  }

  getPixelForValue(value: number, index?: number): number {
    const v = this._table.reduce(
      (acc, { from_time, to_time, from_pos, to_pos }) => {
        if (value >= from_time) {
          if (value < to_time) {
            acc = from_pos + (value - from_time);
          } else {
            acc = to_pos;
          }
        }
        return acc;
      },
      0
    );
    const decimal = v / this._range;
    return this.getPixelForDecimal(decimal);
  }

  getValueForPixel(pixel: number): number | undefined {
    const decimal = this.getDecimalForPixel(pixel);
    const v = decimal * this._range;
    return this._table.reduce(
      (acc, { from_time, to_time, from_pos, to_pos }) => {
        if (v >= from_pos) {
          if (v < to_pos) {
            acc = from_time + (v - from_pos);
          } else {
            acc = to_time;
          }
        }
        return acc;
      },
      0
    );
  }
}

ChartJS.register(
  annotationPlugin,
  baseAnnotationPlugin,
  zoomPlugin,
  CandlestickController,
  CandlestickElement,
  BusinessTimeScale
);

export default function C003({
  date,
  data,
  onChangeDate,
}: {
  readonly date?: string;
  readonly data: FinancialDataPoint[];
  readonly onChangeDate?: (date: string) => void;
}) {
  const hoveredValue = useRef<number | undefined>();

  const xRange = useRef<{ min: number; max: number }>({
    min: dayjs().subtract(1, "days").hour(9).startOf("hour").valueOf(),
    max: dayjs().subtract(1, "days").hour(17).startOf("hour").valueOf(),
  });
  const { min: xMin, max: xMax } = xRange.current;

  const chartType = "candlestick"; // https://www.chartjs.org/chartjs-chart-financial/
  // const chartType = "line"; // https://www.chartjs.org/chartjs-chart-financial/

  let chartData;
  let chartOptions;
  if (data != null && data.length > 0) {
    const [firstData] = data;

    const { min: yMin, max: yMax } = data.reduce(
      (acc, { h, l }) => ({
        min: Math.min(acc.min, l),
        max: Math.max(acc.max, h),
      }),
      { min: Number.POSITIVE_INFINITY, max: Number.NEGATIVE_INFINITY }
    );

    chartData = {
      datasets: [
        // https://github.com/chartjs/chartjs-chart-financial/blob/master/src/controller.financial.js
        {
          type: chartType,
          label: `${firstData.Name}(${firstData.Code})`,
          data: data,
          parsing: false,
          // parsing: { yAxisKey: "c" },
          barThickness: 10,
          // spanGaps: 8 * 60 * 60 * 1000,
          borderColor: "rgb(75, 192, 192)",
        },
      ],
    } as ChartData<typeof chartType>;

    chartOptions = {
      scales: {
        // https://www.chartjs.org/docs/latest/axes/
        x: {
          // https://www.chartjs.org/docs/latest/axes/cartesian/time.html
          // type: "time",
          type: BusinessTimeScale.id,
          time: {
            unit: "hour",
            displayFormats: {
              // https://www.chartjs.org/docs/latest/axes/cartesian/time.html#display-formats
              day: "lt", // https://day.js.org/docs/en/display/format#list-of-localized-formats
            },
            round: "minute",
          },
          ticks: {
            source: "auto",
            autoSkip: false,
            autoSkipPadding: 50,
            maxRotation: 0,
          },
          min: xMin,
          max: xMax,
        },
        y: {
          // https://www.chartjs.org/docs/latest/axes/cartesian/linear.html
          type: "linear",
          min: yMin,
          max: yMax,
          grace: "10%",
        },
      },

      plugins: {
        base_annotation: {
          hover: {
            value: hoveredValue.current,
            label: {
              content(x: number) {
                return dayjs(x).format("ll");
              },
            },
            afterEvent({ x }: Point) {
              hoveredValue.current = x;
            },
          },
          click: {
            afterEvent({ x }: Point) {
              if (onChangeDate != null) {
                // onChangeDate(dayjs(x).format("YYYY-MM-DD"));
              }
            },
          },
        },

        zoom: {
          // https://www.chartjs.org/chartjs-plugin-zoom/latest/guide/options.html
          pan: {
            enabled: true,
            mode: "x",
            onPanComplete({ chart }: { chart: ChartJS }) {
              const { min, max } = chart.scales.x;
              xRange.current = { min, max };
            },
          },
          zoom: {
            wheel: {
              enabled: true,
            },
            pinch: {
              enabled: true,
            },
            mode: "x",
          },
          limits: {
            x: {
              min: dayjs()
                .subtract(3, "days")
                .hour(9)
                .startOf("hour")
                .valueOf(),
              max: dayjs()
                .subtract(1, "days")
                .hour(17)
                .startOf("hour")
                .valueOf(),
            },
          },
        },
      },

      interaction: {
        mode: "nearest",
        axis: "x",
        intersect: false,
      },

      animations: {
        numbers: {
          properties: ["x", "x2"],
          type: "number",
        },
      },
    } as unknown as ChartOptions<typeof chartType>;
  }

  return (
    chartData && (
      <Chart type={chartType} data={chartData} options={chartOptions} />
    )
  );
}
