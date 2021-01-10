import Region from "../region";
import { getAccessToken } from "./wowapi";

export default class AccessToken {
  private readonly region: Region;

  private token = "";

  constructor(region: Region) {
    this.region = region;
  }

  async schedule() {
    const accessToken = await getAccessToken(this.region);
    this.token = accessToken.access_token;

    // expires_in is in seconds, usually 24 hours
    // Lets update five minutes before it expires
    const fiveMinutes = 5 * 60;
    const timeoutMs =
      1000 * Math.max(accessToken.expires_in - fiveMinutes, fiveMinutes);
    setTimeout(() => {
      this.schedule();
    }, timeoutMs);
  }

  get() {
    return this.token;
  }
}
