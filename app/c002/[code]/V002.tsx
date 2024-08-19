"use client";

import { useState } from "react";
import C002 from "./C002";
import type { MarcapData } from "@/utils/fetch";

export default function V001({ data }: { readonly data: MarcapData[] }) {
  const [date, setDate] = useState<string | undefined>();

  function handleChangeDate(newDate: string) {
    setDate(newDate);
  }

  return <C002 date={date} data={data} onChangeDate={handleChangeDate}></C002>;
}
