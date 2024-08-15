"use client";

import { useRef } from "react";
import { Chart as ChartJS } from "chart.js/auto"; // https://github.com/chartjs/Chart.js
import annotationPlugin from "chartjs-plugin-annotation"; // https://github.com/chartjs/chartjs-plugin-annotation
import { Chart } from "react-chartjs-2"; // https://github.com/reactchartjs/react-chartjs-2
import dayjs from "@/utils/dayjs";
import "chartjs-adapter-dayjs-4/dist/chartjs-adapter-dayjs-4.esm"; // https://github.com/bolstycjw/chartjs-adapter-dayjs-4
import type { MarcapData } from "@/utils/fetch";

const hoverAnnotationPlugin = {
  // https://www.chartjs.org/docs/latest/developers/plugins.html
  id: "hover_annotation_plugin",

  // https://www.chartjs.org/docs/latest/api/interfaces/Plugin.html#beforeinit
  beforeInit(chart, args, options) {
    const { annotations } = chart.options.plugins.annotation;
    annotations["hoverLineAnnotation"] = {
      // https://www.chartjs.org/chartjs-plugin-annotation/latest/guide/types/line.html
      type: "line",
      scaleID: "x",
      value: dayjs("2024-04-01", "YYYY-MM-DD").valueOf(),
      borderColor: "rgb(75, 192, 192)",
      borderWidth: 1,
      display: true,
    };
  },

  // https://www.chartjs.org/docs/latest/api/interfaces/Plugin.html#afterevent
  afterEvent(chart, args, options) {
    if (args.event.type === "mousemove") {
      if (
        chart.tooltip.dataPoints != null &&
        chart.tooltip.dataPoints.length > 0
      ) {
        const { x: newValue } = chart.tooltip.dataPoints[0].raw;
        const { annotations } = chart.options.plugins.annotation;

        const currentValue = annotations["hoverLineAnnotation"].value;
        if (currentValue !== newValue) {
          annotations["hoverLineAnnotation"].value = newValue;
          chart.update();
        }
      }
    }
  },

  defaults: {},
};

ChartJS.register(annotationPlugin, hoverAnnotationPlugin);

export default function C001({ data }: { readonly data: MarcapData[] }) {
  const chartRef = useRef<ChartJS>(null);

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
    };

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

      plugins: {},

      interaction: {
        mode: "nearest",
        axis: "x",
        intersect: false,
      },
    };
  }

  return (
    <Chart
      ref={chartRef}
      type={chartType}
      data={chartData}
      options={chartOptions}
    />
  );
}
