/**
 * Coinrail exchange.
 * Docs: https://coinrail.co.kr/api/document
 */
import cheerio from 'cheerio';
import fetch from 'node-fetch';
import { generateResp, insertIntoDatabase } from '../utils';
import fiatCurrencyCodes from '../currency-codes';

const API_URL = 'https://coinrail.co.kr/intro'; // Home page

export default async (event, context, callback) => {
  try {
    const { exchange } = process.env;
    const res = await fetch(API_URL);
    const html = await res.text();
    const $ = cheerio.load(html);

    const coins = $('div[data-cename]')
      .map((i, el) => $(el).data('cename'))
      .get();

    const currencies = new Set();
    coins.forEach(coin => fiatCurrencyCodes.has(coin) || currencies.add(coin));

    const data = Array.from(currencies);

    const body = await insertIntoDatabase(exchange, data);

    callback(null, generateResp(body));
  } catch (error) {
    console.error(error);
  }
};
