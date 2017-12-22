import { DynamoDB, S3, SNS } from 'aws-sdk';
import fiatCurrencyCodes from './currency-codes';
import cryptoCurrencyCodes from './crypto-coin-list';

/**
 * Saves documents into database.
 * @param  {String} exchange  Exchange name.
 * @param  {Array}  docs      Docs to insert.
 * @return {Promise}          [description]
 */
const batchDatabasePutItems = (exchange, docs) =>
  new Promise((resolve, reject) => {
    const dynamodb = new DynamoDB();
    const dbParams = {
      RequestItems: {
        cryptoGuardTable: docs.map(currency => ({
          PutRequest: {
            Item: {
              _id: { S: `${exchange}-${currency}` },
              exchange: { S: exchange },
              currency: { S: currency },
            },
          },
        })),
      },
    };

    dynamodb.batchWriteItem(dbParams, (err, body) => {
      err && reject(err.stack);
      resolve(body);
    });
  });

/**
 * Extracts crypto currency codes from market pairs like: `btcusd`.
 * @TODO: doesn't recognize unknown coins.
 * @param  {String} pair      Market pair.
 * @return {Array}            Array of crypto currency codes.
 */
export const getCryptoCodes = (pair) => {
  const pairLength = pair.length;
  for (let idx = 0; idx < pairLength; idx += 1) {
    const splitPos = idx + 1;
    const firstCode = pair.slice(0, splitPos);
    const secondCode = pair.slice(splitPos);
    // Check if sybol starts with fiat code.
    if (fiatCurrencyCodes.has(firstCode)) {
      // Check if sybol ends with crypto code.
      if (cryptoCurrencyCodes.has(secondCode)) {
        return [secondCode];
      }
    } else if (cryptoCurrencyCodes.has(firstCode)) {
      if (cryptoCurrencyCodes.has(secondCode)) {
        return [firstCode, secondCode];
      } else if (fiatCurrencyCodes.has(secondCode)) {
        return [firstCode];
      }
    }
  }

  return [];
};

/**
 * Generates json response.
 * @param  {String} event Event name.
 * @param  {Object} data  Data.
 * @return {Object}       Response object.
 */
export const generateResp = (event, data) => ({
  statusCode: 200,
  body: JSON.stringify({
    input: event,
    message: JSON.stringify(data),
  }),
});

/**
 * Saves documents into database.
 * @param  {String} exchange  Exchange name.
 * @param  {Array}  docs      Docs to insert.
 * @return {Object}           Result of response.
 */
export const insertIntoDatabase = async (exchange, docs) => {
  const step = 25; // DynamoDB max bulk operation size( 25 items ).
  const chunks = [...Array(Math.ceil(docs.length / step)).keys()];
  const promisesArray = chunks.map((i) => {
    const pos = i * step;
    return batchDatabasePutItems(exchange, docs.slice(pos, pos + step));
  });
  const result = await Promise.all(promisesArray);
  return result;
};

/**
 * Generates text message about new crypto on exchanges.
 * @param  {Object} exchanges Object with exchange name as key, coins array as value.
 * @return {String}           Text message.
 */
const generateTextMessage = exchanges =>
  Object.keys(exchanges)
    .map((exchange) => {
      const coins = exchanges[exchange];
      return `New crypto at ${exchange.toUpperCase()}: ${coins.join(', ')}.`;
    })
    .join(' ');

/**
 * Aggregates coins into exchanges.
 * @param  {Array} docs  Array of exchange/coin pair objects.
 * @return {Object}      Exchange name as key, coins array as value.
 */
const aggregateCoins = (docs) => {
  const exchanges = {};
  docs.forEach(({ currency, exchange }) => {
    if (exchanges[exchange]) {
      exchanges[exchange].push(currency);
    } else {
      exchanges[exchange] = [currency];
    }
  });
  return exchanges;
};

/**
 * Sends text message to specified phone number.
 * @return {Promise} Result of operation.
 */
export const sendTextMessage = (docs) => {
  const exchanges = aggregateCoins(docs);
  const textMsg = generateTextMessage(exchanges);
  const params = {
    Message: `Dzmitry! ${textMsg}` /* required */,
    MessageAttributes: {
      'AWS.SNS.SMS.SenderID': {
        DataType: 'String' /* required */,
        StringValue: 'CryptoGuard',
      },
      'AWS.SNS.SMS.MaxPrice': {
        DataType: 'Number' /* required */,
        StringValue: '0.01',
      },
      'AWS.SNS.SMS.SMSType': {
        DataType: 'String' /* required */,
        StringValue: 'Transactional',
      },
    },
    PhoneNumber: '+13477700110',
  };
  return new Promise((resolve, reject) => {
    const sns = new SNS();
    sns.publish(params, (err, data) => {
      err && reject(err.stack);
      resolve(data);
    });
  });
};

/**
 * Returns difference between elements of two arrays.
 * @param  {Array} a First array.
 * @param  {Array} b Second array.
 * @return {Array}   Diff array.
 */
export const arrayDiff = (a, b) => {
  const s = new Set(b);
  return a.filter(x => !s.has(x));
};

/**
 * Writes file to S3 bucket.
 * @param  {String} path File path.
 * @param  {Object} json Json object to save.
 * @return {Promise}     Result of operation.
 */
export const writeToS3 = (path, json) =>
  new Promise((resolve, reject) => {
    const s3 = new S3();
    const params = {
      Bucket: 'crypto-guard-s3-bucket-json',
      Key: path,
      Body: JSON.stringify(json),
      ContentType: 'application/json',
    };
    s3.putObject(params, (err, data) => {
      err && reject(err.stack);
      resolve(data);
    });
  });

/**
 * Reaads file from S3 bucket.
 * @param  {String} path File path.
 * @return {Object}      Json object.
 */
export const readFromS3 = path =>
  new Promise((resolve) => {
    const s3 = new S3();
    const params = {
      Bucket: 'crypto-guard-s3-bucket-json',
      Key: path,
    };
    s3.getObject(params, (err, data) => {
      err && resolve([]);
      resolve(data ? JSON.parse(data.Body.toString()) : []);
    });
  });
