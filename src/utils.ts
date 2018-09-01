import rp from "request-promise-native";
import { JSDOM } from "jsdom";

export function getDocument(url: string) {
    return new Promise<Document>((resolve, reject) => {
        return rp.get(url).then((body) => {
            const dom = new JSDOM(body);
            return resolve(dom.window.document);
        }, () => {
            return reject("Request failed");
        });
    });
}
