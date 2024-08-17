import { getMarcapData } from "@/utils/fetch";
import V001 from "./V001";

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
      <V001 data={data}></V001>
    </>
  );
}
