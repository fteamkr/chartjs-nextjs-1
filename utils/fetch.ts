import { parse } from "csv-parse"; // https://csv.js.org/parse/distributions/nodejs_esm/
import { promises as fs } from "fs"; // https://nodejs.org/docs/latest-v20.x/api/fs.html
import "server-only";

async function readYearlyMarcapDataFromCSV(year: string) {
  // https://nodejs.org/docs/latest-v20.x/api/fs.html#fspromisesreadfilepath-options
  const file = await fs.readFile(`./data/marcap-${year}.csv`, "utf-8");
  return file;
}

export type MarcapData = {
  Code: string;
  Name: string;
  Close: string;
  Dept: string;
  ChangeCode: string;
  Changes: string;
  ChagesRatio: string;
  Volume: string;
  Amount: string;
  Open: string;
  High: string;
  Low: string;
  Marcap: string;
  Stocks: string;
  Market: string;
  MarketId: string;
  Rank: string;
  Date: string;
};

export async function getMarcapData(code: string): Promise<MarcapData[]> {
  const input = await readYearlyMarcapDataFromCSV("2024");

  return new Promise((resolve, reject) => {
    // https://csv.js.org/parse/api/stream_callback/#combining-a-stream-with-a-entire-dataset
    const records = [];
    parse(input, {
      columns: true,
    })
      .on("readable", function () {
        let record;
        while ((record = this.read())) {
          if (record.Code === code) {
            records.push(record);
          }
        }
      })
      .on("end", function () {
        resolve(records);
      });
  });
}
