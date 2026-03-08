import { BooleanUtils } from "./BooleanUtils";
import { NumberUtils } from "./NumberUtils";

export interface EnvSchema {
    [envKey: string]: "boolean" | "number" | "string";
}

export type EnvMap<S extends EnvSchema> = {
    [K in keyof S]:
        S[K] extends "boolean" ? Readonly<boolean>
        : S[K] extends "number" ? Readonly<number>
        : S[K] extends "string" ? Readonly<string>
        : undefined
};

export class EnvUtils {

    public static getEnvMap<S extends EnvSchema>(
        envSchema: S
    ): EnvMap<S> {

        const rawEnvMap = import.meta.env;
        const envMap = {} as EnvMap<S>;

        for (const envKey in envSchema) {

            const envType = envSchema[envKey];
            const envValue = rawEnvMap[envKey];
            EnvUtils.setEnv(envMap, envKey, envType, envValue);
    
        }

        return envMap;

    }

    private static setEnv<S extends EnvSchema>(
        envMap: EnvMap<S>,
        envKey: keyof S,
        envType: S[keyof S],
        envValue: ImportMetaEnv[Extract<keyof S, string>]
    ): void {

        switch (envType) {
            case "number":
                if (!NumberUtils.isNumber(envValue))
                    throw new Error(
                        `Environmental variable ${String(envKey)} must be a number`
                    );
                envValue = Number(envValue);
                break;
            case "string":
                if (!envValue)
                    throw new Error(
                        `Environmental variable ${String(envKey)} must be given`
                    );
                envValue = String(envValue);
                break;
            case "boolean":
                if (!BooleanUtils.isBooleanString(envValue))
                    throw new Error(
                        `Environmental variable ${String(envKey)} must be a boolean`
                    );
                envValue = BooleanUtils.convertToBoolean(envValue);
                break;
            default:
                throw new Error(`Environmental type "${envType}" unknown.`);
        }

        envMap[envKey] = envValue;

    }

}
