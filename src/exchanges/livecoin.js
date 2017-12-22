/**
 * Livecoin exchange.
 * Docs: https://www.livecoin.net/api
 */
import fetch from 'node-fetch';
import { generateResp, insertIntoDatabase } from '../utils';

const API_URL = 'https://api.livecoin.net/info/coinInfo';

export default async (event, context, callback) => {
  try {
    const { exchange } = process.env;
    const res = await fetch(API_URL);
    const { info } = await res.json();

    const currencies = new Set();
    info.forEach(({ symbol }) => currencies.add(symbol));

    const data = Array.from(currencies);

    const body = await insertIntoDatabase(exchange, data);

    callback(null, generateResp(body));
  } catch (error) {
    console.error(error);
  }
};
