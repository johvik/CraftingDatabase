import rp from "request-promise-native";
import { JSDOM } from "jsdom";

export async function getDocument(url: string): Promise<Document> {
    const body = await rp.get(url);
    const dom = new JSDOM(body);
    return dom.window.document;
}
