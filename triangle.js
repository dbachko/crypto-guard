import api from 'binance';
import fetch from 'node-fetch';
import { getCryptoCodes } from './src/utils';
import binanceSymbols from './src/data/binance-symbols';

const binanceRest = new api.BinanceRest({
  key: '',
  secret: ''
});

const API_URL = 'https://api.binance.com/api/v1/ticker/allPrices';
const exchanges = ['BTC', 'ETH', 'USDT', 'BNB'];

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
 * Gets price for a symbol.
 * @param  {String} symbol Symbol name.
 * @return {Promise}       Result of operation.
 */
async function getSymbolPrice(symbol) {
  return new Promise((resolve, reject) => {
    binanceRest
      .allPrices()
      .then(data => {
        const obj = data.filter(el => el.symbol === symbol)[0];
        resolve(obj ? obj.price : 0);
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
    timestamp: new Date().getTime()
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
async function sellCoinMarket(symbol, quantity) {
  const params = {
    symbol,
    quantity,
    side: 'SELL',
    type: 'MARKET',
    timestamp: new Date().getTime()
  };
  return new Promise((resolve, reject) => {
    binanceRest
      .newOrder(params)
      .then(data => resolve(data))
      .catch(err => reject(err));
  });
}

/**
 * Gets the most profitable triangle.
 * @return {Object} Triangle data.
 */
async function getTriangles() {
  let maxProfitTriangle = { total: 0 };
  const res = await fetch(API_URL);
  const symbols = await res.json();

  const symbolsMap = new Map();
  symbols.forEach(({ symbol, price }) => symbolsMap.set(symbol, price));

  // BCCBTC(symbol) -> BCCETH(symbol1) -> ETHBTC(symbol2)
  symbolsMap.forEach((price, symbol) => {
    const [from, to] = getCryptoCodes(symbol);
    if (from && !exchanges.includes(from) && to === 'BTC') {
      exchanges.filter(el => el !== to).forEach(exchange => {
        const symbol1 = `${from}${exchange}`;
        const symbol2 = `${exchange}${to}`;
        if (symbolsMap.has(symbol1) && symbolsMap.has(symbol2)) {
          const price1 = symbolsMap.get(symbol1);
          const price2 = symbolsMap.get(symbol2);
          const total = 1 / price * price1 * price2;
          if (total > 1.03 && maxProfitTriangle.total < total) {
            maxProfitTriangle = {
              symbol: { name: symbol, price, from },
              symbol1: { name: symbol1, price: price1, from },
              symbol2: { name: symbol2, price: price2, from: exchange },
              total
            };
          }
        }
      });
    }
  });

  return maxProfitTriangle;
}

export default async (event, context, callback) => {
  try {
    console.time('getTriangles');
    const startQauntity = 0.001;
    const maxProfitTriangle = await getTriangles();
    const { symbol, symbol1, symbol2 } = maxProfitTriangle;
    console.log(maxProfitTriangle);
    console.timeEnd('getTriangles');

    if (!symbol) {
      return;
    }

    // 1 ------------------------------------------------------------------------------
    // Calculate how much we can buy.
    const multiplier = binanceSymbols.get(symbol.name);
    const buyingQuantity = (
      Math.floor(startQauntity / symbol.price / multiplier) * multiplier
    ).toFixed(4);
    console.log('1. multiplier, buyingQuantity: ', multiplier, buyingQuantity);

    // ------- Buy first pair.
    const buyResult = await buyCoinMarket(symbol.name, buyingQuantity);
    console.log('1. buyResult: ', buyResult);

    // 2 ------------------------------------------------------------------------------
    const symbol1Price = await getSymbolPrice(symbol1.name);
    console.log('symbol1Price: ', symbol1Price);

    const multiplier1 = binanceSymbols.get(symbol1.name);
    const sellingQuantity1 = (Math.floor(buyingQuantity / multiplier1) * multiplier1).toFixed(4);
    console.log('2. multiplier1, selflingQuantity1: ', multiplier1, sellingQuantity1);

    // ------- Buy second pair.
    const buyResult1 = await sellCoinMarket(symbol1.name, sellingQuantity1);
    console.log('2. buyResult: ', buyResult1);

    // 3 ------------------------------------------------------------------------------
    // Get new ballance.
    const bal = (await getNotNullBalances()).filter(({ asset }) => asset === symbol2.from)[0];
    console.log(`${symbol2.name} balance: `, bal.free);

    const multiplier2 = binanceSymbols.get(symbol2.name);
    const sellingQuantity2 = (Math.floor(bal.free / multiplier2) * multiplier2).toFixed(4);
    console.log('3. multiplier2, sellingQuantity2: ', multiplier2, sellingQuantity2);

    // ------- Buy third pair.
    const sellResult2 = await sellCoinMarket(symbol2.name, startQauntity);
    console.log('3. buyResult: ', sellResult2);
    callback(null, JSON.stringify(sellResult2));
  } catch (err) {
    console.error(err);
  }
};
