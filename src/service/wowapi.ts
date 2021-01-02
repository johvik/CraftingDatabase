import * as t from 'io-ts';
import { DateFromNumber } from 'io-ts-types/lib/DateFromNumber';
import FormData from 'form-data';
import { Headers } from 'node-fetch';
import { WOW_CLIENT_ID, WOW_CLIENT_SECRET } from '../secrets';
import { decodeOrThrow, fetchWithTimeout } from '../utils';

export class Quotas {
  static readonly requestsPerHour = 36000;

  static readonly requestsPerSecond = 100;
}

export enum Region {
  EU = 'eu',
  KR = 'kr',
  TW = 'tw',
  US = 'us',
}

const TToken = t.type({
  access_token: t.string,
});

export async function getAccessToken(region:Region) {
  const url = `https://${region}.battle.net/oauth/token`;
  const credentials = Buffer.from(`${WOW_CLIENT_ID}:${WOW_CLIENT_SECRET}`).toString('base64');
  const formData = new FormData();
  formData.append('grant_type', 'client_credentials');

  const res = await fetchWithTimeout(url, {
    method: 'POST',
    headers: new Headers({
      Authorization: `Basic ${credentials}`,
    }),
    body: formData,
  });

  return decodeOrThrow(TToken, JSON.parse(res.text)).access_token;
}

const AuctionFile = t.type({
  url: t.string,
  lastModified: DateFromNumber,
});

type IAuctionFile = t.TypeOf<typeof AuctionFile>;

const AuctionFiles = t.type({
  files: t.refinement(t.array(AuctionFile), (files) => files.length > 0),
});

type WowRealm = {
  region: Region,
  name: string
};

export async function getAuctionDataStatus(
  realm: WowRealm, accessToken:string,
): Promise<IAuctionFile[]> {
  // {
  //     "files": [{
  //         "url": "http://auction-api-eu.worldofwarcraft.com/auction-data/e4a529d50fe9f24cff1ad0bf1c56c897/auctions.json",
  //         "lastModified": 1535890107000
  //     }]
  // }
  const url = `https://${realm.region}.api.blizzard.com/data/wow/auction/data/${realm.name.toLowerCase()}?access_token=${accessToken}`;
  const res = await fetchWithTimeout(url);

  return decodeOrThrow(AuctionFiles, JSON.parse(res.text)).files;
}

const AuctionItem = t.type({
  item: t.number,
  buyout: t.number,
  quantity: t.number,
});

type IAuctionItem = t.TypeOf<typeof AuctionItem>;

const AuctionRealm = t.type({
  name: t.string,
});

const AuctionData = t.type({
  realms: t.array(AuctionRealm),
  auctions: t.array(AuctionItem),
});

export async function getAuctionData(expectedRealm: string, url: string): Promise<IAuctionItem[]> {
  const expectedName = expectedRealm.toLowerCase();
  const res = await fetchWithTimeout(url);
  const data = decodeOrThrow(AuctionData, JSON.parse(res.text));
  if (!data.realms.some((realm) => realm.name.toLowerCase() === expectedName)) {
    throw new Error(`Realm not found ${expectedRealm}`);
  }
  return data.auctions;
}

const Asset = t.type({
  key: t.string,
  value: t.string,
});

const MediaItem = t.type({
  assets: t.array(Asset),
});

export async function getMediaIcon(url:string, accessToken:string) {
  const mediaUrl = `${url}&access_token=${accessToken}`;
  if (!mediaUrl.startsWith('https://eu.api.blizzard.com/')) {
    throw new Error(`Unexpected media URL ${mediaUrl}`);
  }
  const res = await fetchWithTimeout(mediaUrl);
  const mediaItem = decodeOrThrow(MediaItem, JSON.parse(res.text));

  const icons = mediaItem.assets.filter((asset) => asset.key === 'icon');
  if (icons.length === 0) {
    throw new Error(`No icon found in ${url}`);
  }

  return icons[0].value;
}

const Item = t.type({
  name: t.string,
  media: t.type({ key: t.type({ href: t.string }) }),
  purchase_price: t.number,
});

export async function getItem(itemId: number, accessToken:string) {
  const url = `https://eu.api.blizzard.com/data/wow/item/${itemId}?namespace=static-eu&locale=en_GB&access_token=${accessToken}`;
  const res = await fetchWithTimeout(url);
  const item = decodeOrThrow(Item, JSON.parse(res.text));
  const icon = await getMediaIcon(item.media.key.href, accessToken);
  return {
    name: item.name,
    icon,
    price: item.purchase_price,
  };
}
