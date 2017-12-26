import { generateResp, readFromS3, sendTextMessage } from './utils';

/**
 * Sends text message about new crypto on exchanges.
 */
export const index = async (event, context, callback) => {
  const { Records } = event;

  const currencies = [];
  Records.forEach(({ eventName, dynamodb }) => {
    // Check only new records.
    if (['INSERT'].includes(eventName)) {
      currencies.push({
        currency: dynamodb.NewImage.currency.S,
        exchange: dynamodb.NewImage.exchange.S,
      });
    }
  });

  // If new crypto was added -> notify our subscribers.
  if (currencies.length) {
    const subscribers = await readFromS3('subscribers.json');
    await subscribers.forEach(async subscriber => sendTextMessage(subscriber, currencies));
  }

  console.log('We\'ve got a new crypto: ', currencies);

  callback(null, generateResp(event, currencies));
};
