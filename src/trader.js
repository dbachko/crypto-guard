import { aggregateCoins, generateResp } from './utils';

/**
 * Trading bot lisens for DB chanes.
 */
export const index = async (event, context, callback) => {
  const { Records } = event;

  const pairs = [];
  Records.forEach(({ eventName, dynamodb }) => {
    // Check only new records.
    if (['INSERT'].includes(eventName)) {
      pairs.push({
        currency: dynamodb.NewImage.currency.S,
        exchange: dynamodb.NewImage.exchange.S,
      });
    }
  });

  // Check where new crypto were added.
  if (pairs.length) {
    const aggregatedCoins = aggregateCoins(pairs);
    Object.keys(aggregatedCoins).forEach((exchange) => {
      if (exchange === 'GDAX') {
        // const coins = aggregatedCoins[exchange];
        // run proper run proper exchange commands
        // 1. sell all alts on binance
        // 2. buy coins
      }
    });
  }

  callback(null, generateResp(event, pairs));
};
