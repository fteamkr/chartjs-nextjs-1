import { faker } from "@faker-js/faker";
import dayjs from "@/utils/dayjs";
import V003 from "./V003";

export default async function Page({
  params,
}: {
  readonly params: { readonly code: string };
}) {
  const { code } = params;
  const dates = [
    ...faker.date.betweens({
      from: dayjs().subtract(2, "days").hour(5).startOf("hour").valueOf(),
      to: dayjs().subtract(2, "days").hour(17).startOf("hour").valueOf(),
      count: 100,
    }),
    ...faker.date.betweens({
      from: dayjs().subtract(1, "days").hour(5).startOf("hour").valueOf(),
      to: dayjs().subtract(1, "days").hour(17).startOf("hour").valueOf(),
      count: 100,
    }),
  ];

  const data = dates
    .toSorted((a, b) => a.getTime() - b.getTime())
    .map((date) => {
      const rates = Array.from({ length: 4 }, () =>
        faker.number.float({ min: 2, max: 5 })
      );

      return {
        x: dayjs(date).valueOf(),
        o: rates[0],
        h: Math.max(...rates),
        l: Math.min(...rates),
        c: rates[3],
      };
    });

  return (
    <>
      <div>Code: {code}</div>
      <V003 data={data}></V003>
    </>
  );
}
