# Crypto Guard

Makes money while you sleep.

## How to install

1. Clone this repo
2. Run `npm install`
3. Deploy with `serverless deploy`
4. Create `subscribers.json` using this structure: `[{"name": "", "phone": ""}, ...]` inside `crypto-guard-s3-bucket-json` S3 bucket.

## Roadmap

1. Create common wrapper for Trading bot.
2. Implement Triangular arbitrage strategy.
3. Separate codebase into services.
4. Binance: parse https://support.binance.com/hc/en-us/articles/115000594711-Trading-Rule

## Crypto coin list update

1. Fetch https://www.cryptocompare.com/api/data/coinlist/
2. Run this in a Browser console:

```javascript
JSON.stringify(Object.keys(json.Data).sort());
```

## Binance symbols update

1. Go to https://support.binance.com/hc/en-us/articles/115000594711-Trading-Rule
2. Run this in a Browser console:

```javascript
let tbl = $('table tr:has(td)')
  .map(function() {
    const $td = $('td', this);
    return [
      [
        $td
          .eq(1)
          .text()
          .replace('/', ''),
        $td.eq(2).text(),
      ],
    ];
  })
  .get();

JSON.stringify(tbl);
```
