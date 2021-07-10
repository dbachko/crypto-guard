/**
 * Fetches coin list.
 * Docs: https://www.cryptocompare.com/api
 */
import fetch from 'node-fetch';
import { generateResp, readFromS3, writeToS3 } from './utils';

const API_URL = 'https://min-api.cryptocompare.com/data/all/coinlist';

/**
 * Updates coinlist with new coins.
 */
export const index = async (event, context, callback) => {
  try {
    const coinlistS3 = await readFromS3('coinlist.json');
    const coinlistS3Set = new Set(coinlistS3);

    const res = await fetch(API_URL);
    const json = await res.json();
    const coinlist = Object.keys(json.Data);

    if (coinlist.some((el) => !coinlistS3Set.has(el))) {
      console.log("We've got new coins!");
      writeToS3('coinlist.json', coinlist);
    }

    callback(null, generateResp(event, {}));
  } catch (error) {
    console.error(error);
  }
};
