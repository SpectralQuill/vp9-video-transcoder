export class NumberUtils {

    public static isNumber(value: unknown): boolean {

        return !isNaN(Number(value));

    }

}
