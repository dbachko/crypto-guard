/**
 * YoBit exchange.
 * Docs: https://www.yobit.net/en/api/
 */
import fetch from 'node-fetch';
import { arrayDiff, generateResp, insertIntoDatabase, readFromS3, writeToS3 } from '../utils';
import fiatList from '../data/fiat-list';

const API_URL = 'https://yobit.net/api/3/info';
const cacheName = 'yobit.json';

export default async (event, context, callback) => {
  try {
    const { exchange } = process.env;
    const res = await fetch(API_URL);
    if (!res.ok) {
      throw new Error(res.statusText);
    }
    const { pairs } = await res.json();
    const currencies = new Set();
    Object.keys(pairs).forEach((pair) => {
      // pairs presented as `ltc_btc`.
      pair.split('_').forEach((currency) => {
        // Filter out fiat currencies.
        fiatList.has(currency) || currencies.add(currency);
      });
    });

    const data = Array.from(currencies);
    const cachedCrypto = await readFromS3(cacheName);
    const newCrypto = arrayDiff(data, cachedCrypto);

    // Save to database.
    const body = await insertIntoDatabase(exchange, newCrypto);

    // Save new crypto to S3 bucket.
    await writeToS3(cacheName, data);

    callback(null, generateResp(body));
  } catch (error) {
    console.error(error);
  }
};
