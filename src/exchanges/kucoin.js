/**
 * Kucoin exchange.
 * Docs: https://kucoinapidocs.docs.apiary.io/#
 */
import fetch from 'node-fetch';
import { generateResp, insertIntoDatabase } from '../utils';

const API_URL = 'https://api.kucoin.com/v1/market/open/coins';

export default async (event, context, callback) => {
  try {
    const { exchange } = process.env;
    const res = await fetch(API_URL);
    const { data } = await res.json();
    const coins = data.map(({ coin }) => coin);

    const body = await insertIntoDatabase(exchange, coins);

    callback(null, generateResp(body));
  } catch (error) {
    console.error(error);
  }
};
