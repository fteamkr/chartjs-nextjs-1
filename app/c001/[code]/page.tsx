import C001 from "./C001";

export default function Page({
  params,
}: {
  readonly params: { readonly code: string };
}) {
  return (
    <>
      <div>code: {params.code}</div>
      <C001></C001>
    </>
  );
}
