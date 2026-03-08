import { EnvSchema } from "../utils/EnvUtils";

export const APP_ENV_SCHEMA = {
    VITE_PROTOTYPE_VIDEOS_PATH: "string"
} as const satisfies EnvSchema;
