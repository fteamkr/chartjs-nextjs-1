"use client";

import { useState } from "react";
import C003 from "./C003";
import type { MarcapData } from "@/utils/fetch";

export default function V001({ data }: { readonly data: MarcapData[] }) {
  const [date, setDate] = useState<string | undefined>();

  function handleChangeDate(newDate: string) {
    setDate(newDate);
  }

  return <C003 date={date} data={data} onChangeDate={handleChangeDate}></C003>;
}
