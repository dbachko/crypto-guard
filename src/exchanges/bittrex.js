/**
 * Bittrex exchange.
 * Docs: https://www.bittrex.com/Home/Api
 */
import fetch from 'node-fetch';
import { generateResp, insertIntoDatabase } from '../utils';

const API_URL = 'https://bittrex.com/api/v1.1/public/getcurrencies';

export default async (event, context, callback) => {
  try {
    const { exchange } = process.env;
    const res = await fetch(API_URL);
    const { result } = await res.json();
    const data = result.map(({ Currency }) => Currency);

    const body = await insertIntoDatabase(exchange, data);

    callback(null, generateResp(body));
  } catch (error) {
    console.error(error);
  }
};
