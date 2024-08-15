"use client";

import { useRef } from "react";
import "chart.js/auto";
import { Chart } from "react-chartjs-2";
import type { Chart as ChartJS } from "chart.js";
import type { MarcapData } from "@/utils/fetch";

export default function C001({ data }: { readonly data: MarcapData[] }) {
  const chartRef = useRef<ChartJS>(null);

  const chartType = "line"; // https://www.chartjs.org/docs/latest/charts/line.html

  let chartData;
  if (data != null && data.length > 0) {
    const [firstData] = data;

    chartData = {
      datasets: [
        {
          label: `${firstData.Name}(${firstData.Code})`,
          data: data.map(({ Date: d, Close }) => ({ x: d, y: Close })),
          fill: false,
          borderColor: "rgb(75, 192, 192)",
          tension: 0.1,
        },
      ],
    };
  }

  return <Chart ref={chartRef} type={chartType} data={chartData} />;
}
