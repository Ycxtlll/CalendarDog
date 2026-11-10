import { invoke } from "@tauri-apps/api/core";

import type { UpdateSummary, YearHolidays } from "@/types";

export const getYearHolidays = (year: number) =>
  invoke<YearHolidays | null>("get_year_holidays", { year });

export const updateHolidays = () => invoke<UpdateSummary>("update_holidays");
