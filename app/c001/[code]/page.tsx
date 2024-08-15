import C001 from "./C001";
import { getMarcapData } from "@/utils/fetch";

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
      <C001 data={data}></C001>
    </>
  );
}
