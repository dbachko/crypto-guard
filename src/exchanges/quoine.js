/**
 * Quoine exchange.
 * Docs: https://developers.quoine.com/
 */
import fetch from 'node-fetch';
import { generateResp, insertIntoDatabase } from '../utils';

const API_URL = 'https://api.qryptos.com/products';

export default async (event, context, callback) => {
  try {
    const { exchange } = process.env;
    const res = await fetch(API_URL);
    const json = await res.json();

    const currencies = new Set();
    json.forEach(({ base_currency: currency }) => currencies.add(currency));

    const data = Array.from(currencies);

    console.log('data length ', data.length);

    const body = await insertIntoDatabase(exchange, data);

    callback(null, generateResp(body));
  } catch (error) {
    console.error(error);
  }
};
