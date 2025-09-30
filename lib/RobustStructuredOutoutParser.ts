import { StructuredOutputParser } from "langchain/output_parsers";
import { z } from "zod";

export default class RobustStructuredOutputParser<T extends z.ZodTypeAny> extends StructuredOutputParser<T> {
    constructor(schema: T) {
        super(schema);
    }

    override parse(text: string): Promise<z.infer<T>> {
        // Clean the text by removing markdown code blocks
        let cleanedText = text.trim();

        // First, try to extract content from <output> tags if present
        const outputMatch = cleanedText.match(/<output>([\s\S]*?)<\/output>/);
        if (outputMatch) {
            cleanedText = outputMatch[1]?.trim() ?? "";
        }

        // Remove markdown code blocks (```json...``` or ```...```)
        cleanedText = cleanedText.replace(/^```(?:json)?\s*\n?/, '');
        cleanedText = cleanedText.replace(/\n?```\s*$/, '');

        // Remove any trailing backticks or quotes
        cleanedText = cleanedText.replace(/["'`]*$/, '');

        // Handle case where LLM outputs array elements without wrapping brackets
        // This happens when the schema expects an array but LLM outputs: { ... }, { ... }
        if (cleanedText.includes('},{') && !cleanedText.startsWith('[')) {
            // Wrap in array brackets and clean up
            cleanedText = '[' + cleanedText + ']';
        }

        // Try to find JSON content if it's wrapped in other text
        const jsonMatch = cleanedText.match(/[\[\{][\s\S]*[\}\]]/);
        if (jsonMatch) {
            cleanedText = jsonMatch[0];
        }

        // --- Normalization: if model returned a single instruction object, wrap into an array ---
        try {
            const maybe = JSON.parse(cleanedText);
            const isObject = maybe && typeof maybe === "object" && !Array.isArray(maybe);
            if (isObject) {
                const isReaction = (maybe as any).type === "reaction";
                const looksLikeInstruction = typeof (maybe as any).instruction === "string";
                if (!isReaction && looksLikeInstruction) {
                    // Coerce into the array shape your schema expects
                    cleanedText = JSON.stringify([maybe]);
                }
            }
        } catch {
            // ignore; we'll let the normal parse flow handle other cases
        }
        // -----------------------------------------------------------------

        try {
            return super.parse(cleanedText);
        } catch (error) {
            console.error('Failed to parse JSON:', {
                originalText: text,
                cleanedText: cleanedText,
                error: error instanceof Error ? error.message : String(error)
            });
            throw error;
        }
    }
}