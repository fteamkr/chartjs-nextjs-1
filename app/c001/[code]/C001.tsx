"use client";

import { useRef } from "react";
import { Chart as ChartJS } from "chart.js/auto"; // https://github.com/chartjs/Chart.js
import annotationPlugin from "chartjs-plugin-annotation"; // https://github.com/chartjs/chartjs-plugin-annotation
import { Chart } from "react-chartjs-2"; // https://github.com/reactchartjs/react-chartjs-2
import dayjs from "@/utils/dayjs";
import "chartjs-adapter-dayjs-4/dist/chartjs-adapter-dayjs-4.esm"; // https://github.com/bolstycjw/chartjs-adapter-dayjs-4
import type { ChartData, ChartOptions, ChartEvent, Point } from "chart.js";
import type { LineAnnotationOptions } from "chartjs-plugin-annotation";
import type { MarcapData } from "@/utils/fetch";

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
    } as LineAnnotationOptions;

    if (chart.options.plugins == null) {
      chart.options.plugins = { annotation: { annotations: [] } };
    }

    if (chart.options.plugins.annotation == null) {
      chart.options.plugins.annotation = { annotations: [] };
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

ChartJS.register(annotationPlugin, baseAnnotationPlugin);

export default function C001({
  date,
  data,
  onChangeDate,
}: {
  readonly date?: string;
  readonly data: MarcapData[];
  readonly onChangeDate?: (date: string) => void;
}) {
  const hoveredValue = useRef<number | undefined>();

  const chartType = "line"; // https://www.chartjs.org/docs/latest/charts/line.html

  let chartData;
  let chartOptions;
  if (data != null && data.length > 0) {
    const [firstData] = data;

    chartData = {
      datasets: [
        // https://www.chartjs.org/docs/latest/charts/line.html#dataset-properties
        {
          label: `${firstData.Name}(${firstData.Code})`,
          data: data.map(({ Date: d, Close: c }) => ({
            x: dayjs(d, "YYYY-MM-DD").valueOf(), // https://day.js.org/docs/en/parse/string-format
            y: Number.parseInt(c, 10),
          })),
          parsing: false,
          fill: false,
          borderColor: "rgb(75, 192, 192)",
          tension: 0.1,
        },
      ],
    } as ChartData<typeof chartType>;

    chartOptions = {
      scales: {
        // https://www.chartjs.org/docs/latest/axes/
        x: {
          // https://www.chartjs.org/docs/latest/axes/cartesian/time.html
          type: "time",
          time: {
            unit: "day",
            displayFormats: {
              // https://www.chartjs.org/docs/latest/axes/cartesian/time.html#display-formats
              day: "ll", // https://day.js.org/docs/en/display/format#list-of-localized-formats
            },
          },
        },
        y: {
          // https://www.chartjs.org/docs/latest/axes/cartesian/linear.html
          type: "linear",
          beginAtZero: true,
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
                onChangeDate(dayjs(x).format("YYYY-MM-DD"));
              }
            },
          },
        },
      },

      interaction: {
        mode: "nearest",
        axis: "x",
        intersect: false,
      },
    } as ChartOptions<typeof chartType>;
  }

  return (
    chartData && (
      <Chart type={chartType} data={chartData} options={chartOptions} />
    )
  );
}
