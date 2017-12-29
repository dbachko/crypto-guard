/**
 * Bithumb exchange.
 * Docs: https://www.bithumb.com/u1/US127
 */
import fetch from 'node-fetch';
import { generateResp, insertIntoDatabase } from '../utils';

const API_URL = 'https://api.bithumb.com/public/ticker/ALL';

export default async (event, context, callback) => {
  try {
    const { exchange } = process.env;
    const res = await fetch(API_URL);
    const { data } = await res.json();

    const coins = Object.keys(data).filter(name => name !== 'date');

    const body = await insertIntoDatabase(exchange, coins);

    callback(null, generateResp(body));
  } catch (error) {
    console.error(error);
  }
};
