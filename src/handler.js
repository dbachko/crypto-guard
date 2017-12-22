import { generateResp, sendTextMessage } from './utils';

/**
 * Handles updates to database.
 */
export const updates = async (event, context, callback) => {
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

  currencies.length && (await sendTextMessage(currencies));

  console.log('We\'ve got a new crypto: ', currencies);

  callback(null, generateResp(event, currencies));
};

export default {
  updates,
};
