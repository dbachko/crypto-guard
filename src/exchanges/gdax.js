/**
 * GDAX exchange.
 * Docs: https://docs.gdax.com/#api
 */
import fetch from 'node-fetch';
import { generateResp, insertIntoDatabase } from '../utils';
import fiatList from '../data/fiat-list';

const API_URL = 'https://api.gdax.com/currencies';

export default async (event, context, callback) => {
  try {
    const { exchange } = process.env;
    const res = await fetch(API_URL);
    const json = await res.json();

    const currencies = new Set();
    json.forEach(({ id }) => fiatList.has(id) || currencies.add(id));

    const data = Array.from(currencies);

    const body = await insertIntoDatabase(exchange, data);

    callback(null, generateResp(body));
  } catch (error) {
    console.error(error);
  }
};
