"use client";

import { useRef } from "react";
import "chart.js/auto";
import { Chart } from "react-chartjs-2";
import dayjs from "@/utils/dayjs";
import "chartjs-adapter-dayjs-4/dist/chartjs-adapter-dayjs-4.esm"; // https://github.com/bolstycjw/chartjs-adapter-dayjs-4
import type { Chart as ChartJS } from "chart.js";
import type { MarcapData } from "@/utils/fetch";

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
