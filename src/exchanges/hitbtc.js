/**
 * HitBTC exchange.
 * Docs: https://api.hitbtc.com/
 */
import fetch from 'node-fetch';
import { generateResp, insertIntoDatabase } from '../utils';

const API_URL = 'https://api.hitbtc.com/api/2/public/currency';

export default async (event, context, callback) => {
  try {
    const { exchange } = process.env;
    const res = await fetch(API_URL);
    const json = await res.json();

    // crypto - Is currency belongs to blockchain (false for ICO and fiat, like EUR)
    // @TODO: send msg about new for ICO's
    const currencies = new Set();
    json.forEach(({ id, crypto }) => crypto && currencies.add(id));

    const data = Array.from(currencies);

    const body = await insertIntoDatabase(exchange, data);

    callback(null, generateResp(body));
  } catch (error) {
    console.error(error);
  }
};
