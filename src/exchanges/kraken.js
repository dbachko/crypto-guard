/**
 * Kraken exchange.
 * Docs: https://www.kraken.com/help/api
 */
import fetch from 'node-fetch';
import { generateResp, insertIntoDatabase } from '../utils';

const API_URL = 'https://api.kraken.com/0/public/AssetPairs';

export default async (event, context, callback) => {
  try {
    const { exchange } = process.env;
    const res = await fetch(API_URL);
    const { result } = await res.json();

    const currencies = new Set();
    Object.keys(result)
      .map(key => result[key])
      .forEach(({ base }) => currencies.add(base));
    const data = Array.from(currencies);

    const body = await insertIntoDatabase(exchange, data);

    callback(null, generateResp(body));
  } catch (error) {
    console.error(error);
  }
};
