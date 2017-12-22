/**
 * Bitstamp exchange.
 * Docs: https://www.bitstamp.net/api/
 */
import fetch from 'node-fetch';
import { generateResp, insertIntoDatabase } from '../utils';
import fiatCurrencyCodes from '../currency-codes';

const API_URL = 'https://www.bitstamp.net/api/v2/trading-pairs-info/';

export default async (event, context, callback) => {
  try {
    const { exchange } = process.env;
    const res = await fetch(API_URL);
    const json = await res.json();

    const currencies = new Set();
    json.forEach(({ name }) => {
      // Pairs presented as `LTC/USD`.
      name.split('/').forEach((currency) => {
        // Filter fiat currencies.
        fiatCurrencyCodes.has(currency) || currencies.add(currency);
      });
    });

    const data = Array.from(currencies);

    const body = await insertIntoDatabase(exchange, data);

    callback(null, generateResp(body));
  } catch (error) {
    console.error(error);
  }
};
