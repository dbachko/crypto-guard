/**
 * Bitfinex exchange.
 * Docs: https://docs.bitfinex.com/docs
 */
import fetch from 'node-fetch';
import { getCryptoCodes, generateResp, insertIntoDatabase } from '../utils';

const API_URL = 'https://api.bitfinex.com/v1/symbols';

export default async (event, context, callback) => {
  try {
    const { exchange } = process.env;
    const res = await fetch(API_URL);
    const json = await res.json();

    const currencies = new Set();
    json.forEach((pair) => {
      getCryptoCodes(pair.toUpperCase()).forEach(code => currencies.add(code));
    });

    const data = Array.from(currencies);

    const body = await insertIntoDatabase(exchange, data);

    callback(null, generateResp(body));
  } catch (error) {
    console.error(error);
  }
};
