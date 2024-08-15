"use client";

import { useRef } from "react";
import "chart.js/auto";
import { Chart } from "react-chartjs-2";
import type { Chart as ChartJS } from "chart.js";

export default function C001() {
  const chartRef = useRef<ChartJS>(null);

  const chartType = "line"; // https://www.chartjs.org/docs/latest/charts/line.html

  const chartData = {
    labels: [1, 2, 3, 4, 5, 6, 7],
    datasets: [
      {
        label: "Dataset#1",
        data: [65, 59, 80, 81, 56, 55, 40],
        fill: false,
        borderColor: "rgb(75, 192, 192)",
        tension: 0.1,
      },
    ],
  };

  return <Chart ref={chartRef} type={chartType} data={chartData} />;
}
