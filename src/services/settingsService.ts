import { invoke } from "@tauri-apps/api/core";

import type { Settings } from "@/types";

export const getSettings = () => invoke<Settings>("get_settings");

export const setSettings = (settings: Settings) =>
  invoke<Settings>("set_settings", { settings });

export const togglePin = () => invoke<boolean>("toggle_pin");
