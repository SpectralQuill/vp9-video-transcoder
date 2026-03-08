import { NumberUtils } from "./NumberUtils";

export type BooleanString = "true" | "false";

export const BOOLEAN_STRINGS: ReadonlyArray<BooleanString> = [
    "true", "false"
];

export class BooleanUtils {

    public static convertToBoolean(value: unknown): boolean {

        if (NumberUtils.isNumber(value)) {

            const number = Number(value);
            return Boolean(number);

        } else if (typeof value === "string") {

            value = value.toLowerCase().trim();
            switch(value) {
                case "true": return true;
                case "false": return false;
                default: return Boolean(value);
            }

        } else return Boolean(value);

    }

    public static convertToBooleanString(value: unknown): BooleanString {

        const boolean = Boolean(value);
        return boolean ? "true" : "false";

    }

    public static isBooleanString(string: string): boolean {

        string = string.toLowerCase().trim();
        return BOOLEAN_STRINGS.includes(string as BooleanString);

    }

}
