/**
 * Poloniex exchange.
 * Docs: https://poloniex.com/support/api/
 */
import fetch from 'node-fetch';
import { generateResp, insertIntoDatabase } from '../utils';

const API_URL = 'https://poloniex.com/public?command=returnCurrencies';

export default async (event, context, callback) => {
  try {
    const { exchange } = process.env;
    const res = await fetch(API_URL);
    const result = await res.json();
    const data = Object.keys(result);

    const body = await insertIntoDatabase(exchange, data);

    callback(null, generateResp(body));
  } catch (error) {
    console.error(error);
  }
};
