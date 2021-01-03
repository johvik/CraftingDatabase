import * as t from 'io-ts';
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

const AuctionItem = t.intersection([
  t.type({
    item: t.type({ id: t.number }),
    quantity: t.number,
  }),
  t.union([
    t.type({ buyout: t.number }),
    t.type({ unit_price: t.number }),
  ]),
]);

type IAuctionItem = t.TypeOf<typeof AuctionItem>;

const AuctionData = t.type({
  connected_realm: t.type({
    href: t.string,
  }),
  auctions: t.array(AuctionItem),
});

interface AuctionResult {
  lastModified?: Date,
  auctions: IAuctionItem[],
}

export async function getAuctionData(
  region:Region, connectedRealmId: number, accessToken:string,
): Promise<AuctionResult> {
  const url = `https://${region}.api.blizzard.com/data/wow/connected-realm/${connectedRealmId}/auctions?namespace=dynamic-${region}&access_token=${accessToken}`;
  const res = await fetchWithTimeout(url);
  const data = decodeOrThrow(AuctionData, JSON.parse(res.text));
  if (data.connected_realm.href.indexOf(connectedRealmId.toString()) === -1) {
    throw new Error(`ConnectedRealmId not found ${connectedRealmId}`);
  }
  return { lastModified: res.lastModified, auctions: data.auctions };
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
