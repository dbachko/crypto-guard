/**
 * Binance exchange.
 * Docs: https://www.binance.com/restapipub.html
 */
import fetch from 'node-fetch';
import { getCoinlist, getCryptoCodes, generateResp, insertIntoDatabase } from '../utils';

const API_URL = 'https://api.binance.com/api/v1/ticker/allPrices';

export default async (event, context, callback) => {
  try {
    const { exchange } = process.env;
    const res = await fetch(API_URL);
    const json = await res.json();

    const coinlist = await getCoinlist();

    const currencies = new Set();
    json.forEach(({ symbol }) => {
      getCryptoCodes(symbol, coinlist).forEach((code) => currencies.add(code));
    });

    const data = Array.from(currencies);

    const body = await insertIntoDatabase(exchange, data);

    callback(null, generateResp(body));
  } catch (error) {
    console.error(error);
  }
};
