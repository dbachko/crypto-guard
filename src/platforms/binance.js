import api from 'binance';
import { generateResp } from '../utils';

const binanceRest = new api.BinanceRest({
  key: 'ScuPV8w9WYsAyPfMHJI19qq02BipDOuySoXLOvUv4iPTRjmPq04z1GgA9AQvIb3g',
  secret: 'vomlFdKD8v8Mqpe8n3D3JcLO1StzlIHK0oaB21EQUShWIB2IKPy8i7LGhrKZkDal',
});

/**
 * Get all accounts not null balances.
 * @return {Array} Array of balance objects.
 */
async function getNotNullBalances() {
  return new Promise((resolve, reject) => {
    binanceRest
      .account()
      .then(({ balances }) => {
        resolve(balances.filter(({ free }) => !!Number.parseFloat(free)));
      })
      .catch(err => reject(err));
  });
}

/**
 * Buys coin with from coin( market price ).
 * @param  {String} symbol   Coin to buy.
 * @param  {Number} quantity Amount.
 * @return {Promise}         Result of operation.
 */
async function buyCoinMarket(symbol, quantity) {
  const params = {
    symbol,
    quantity,
    side: 'BUY',
    type: 'MARKET',
    timestamp: new Date().getTime(),
  };
  return new Promise((resolve, reject) => {
    binanceRest
      .newOrder(params)
      .then(data => resolve(data))
      .catch(err => reject(err));
  });
}

/**
 * Sells multiple coins at market price.
 * @param  {Array} coins  Array of coins to sell.
 * @return {Promise}      Result of operation.
 */
async function sellCoinsMarket(coins, to) {
  return Promise.all(coins.map(async ({ asset, free }) => {
    const params = {
      side: 'SELL',
      symbol: `${asset}${to}`,
      type: 'MARKET',
      quantity: 0.02,
      timestamp: new Date().getTime(),
    };
    return new Promise(async (resolve, reject) => {
      binanceRest
        .newOrder(params)
        .then(data => resolve(data))
        .catch(err => reject(err));
    });
  }));
}

/**
 * Gets price for a symbol.
 * @param  {String} symbol Symbol name.
 * @return {Promise}       Result of operation.
 */
async function getSymbolPrice(symbol) {
  return new Promise((resolve, reject) => {
    binanceRest
      .allPrices()
      .then((data) => {
        const obj = data.filter(el => el.symbol === symbol)[0];
        resolve(obj ? obj.price : 0);
      })
      .catch(err => reject(err));
  });
}

/**
 * Sells all altcoins for BTC -> buys single altcoin using BTC ballance.
 */
export const index = async (event, context, callback) => {
  try {
    // Get all not null alts balances.
    const alts = (await getNotNullBalances()).filter(({ asset }) => asset !== 'BTC');
    console.log('alts: ', alts);

    // Sell all alts for BTC.
    const sellResult = await sellCoinsMarket(alts, 'BTC');
    console.log('sellResult: ', sellResult);

    // Get new BTC ballance.
    const btc = (await getNotNullBalances()).filter(({ asset }) => asset === 'BTC')[0];
    console.log('btc: ', btc.free);

    // Get market price for altcoin we want to buy.
    const altPrice = await getSymbolPrice('LTCBTC');
    console.log('altPrice: ', altPrice);

    // Calculate how much we can buy(LTC min buy amount is 0.01).
    const buyingQuantity = Math.floor(btc.free / altPrice * 100) / 100;
    console.log('buyingQuantity: ', buyingQuantity);

    // Buy altcoin.
    const buyResult = await buyCoinMarket('LTCBTC', buyingQuantity);
    console.log('buyResult: ', buyResult);

    callback(null, generateResp(null, { sellResult, buyResult }));
  } catch (err) {
    console.error(err);
  }
};
