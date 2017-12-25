/**
 * CEX.IO exchange.
 * Docs: https://cex.io/rest-api
 */
import fetch from 'node-fetch';
import { generateResp, insertIntoDatabase } from '../utils';
import fiatList from '../data/fiat-list';

const API_URL = 'https://cex.io/api/currency_limits';

export default async (event, context, callback) => {
  try {
    const { exchange } = process.env;
    const res = await fetch(API_URL);
    const { data: { pairs } } = await res.json();

    const currencies = new Set();
    pairs.forEach(({ symbol1 }) => fiatList.has(symbol1) || currencies.add(symbol1));
    const data = Array.from(currencies);

    const body = await insertIntoDatabase(exchange, data);

    callback(null, generateResp(body));
  } catch (error) {
    console.error(error);
  }
};
