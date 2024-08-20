import { getMarcapData } from "@/utils/fetch";
import V002 from "./V002";

export default async function Page({
  params,
}: {
  readonly params: { readonly code: string };
}) {
  const { code } = params;
  const data = await getMarcapData(code);

  return (
    <>
      <div>Code: {code}</div>
      <V002 data={data}></V002>
    </>
  );
}
