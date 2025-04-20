import { useEffect, useState, useMemo } from 'react';
import Chart from 'react-apexcharts';

const ALPHA_VANTAGE_API_KEY = '9L4HUWC0NFG3NQ6S';
const symbol = 'AAPL'; // Default stock symbol, can be changed to any global stock symbol
const interval = '5min'; // Interval for time series data

async function getStockData() {
  const url = `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=${interval}&apikey=${ALPHA_VANTAGE_API_KEY}&outputsize=compact`;
  const response = await fetch(url);
  return response.json();
}

const directionEmojis = {
  up: '🚀',
  down: '💩',
  '': '',
};

const chartOptions = {
  chart: {
    type: 'candlestick',
    height: 350,
  },
  title: {
    text: 'CandleStick Chart',
    align: 'left',
  },
  xaxis: {
    type: 'datetime',
  },
  yaxis: {
    tooltip: {
      enabled: true,
    },
  },
};

const round = (number) => {
  return number ? +(parseFloat(number).toFixed(2)) : null;
};

function App() {
  const [series, setSeries] = useState([{ data: [] }]);
  const [price, setPrice] = useState(-1);
  const [prevPrice, setPrevPrice] = useState(-1);
  const [priceTime, setPriceTime] = useState(null);

  useEffect(() => {
    let timeoutId;

    async function getLatestPrice() {
      try {
        const data = await getStockData();
        // Alpha Vantage returns data in "Time Series (5min)" key
        const timeSeriesKey = `Time Series (${interval})`;
        const timeSeries = data[timeSeriesKey];
        if (!timeSeries) {
          console.error('Invalid data format or API limit reached', data);
          return;
        }

        // Extract timestamps and sort ascending (oldest first)
        const timestamps = Object.keys(timeSeries).sort((a, b) => new Date(a) - new Date(b));

        // Prepare prices for candlestick chart
        const prices = timestamps.map((timestamp) => {
          const candle = timeSeries[timestamp];
          return {
            x: new Date(timestamp),
            y: [
              round(candle['1. open']),
              round(candle['2. high']),
              round(candle['3. low']),
              round(candle['4. close']),
            ],
          };
        });

        // Set latest price and time
        const latestTimestamp = timestamps[timestamps.length - 1];
        const latestCandle = timeSeries[latestTimestamp];
        setPrevPrice(price);
        setPrice(round(latestCandle['4. close']));
        setPriceTime(new Date(latestTimestamp));

        setSeries([{ data: prices }]);
      } catch (error) {
        console.error(error);
      }
      timeoutId = setTimeout(getLatestPrice, 10000); // Update every 10 seconds
    }

    getLatestPrice();

    return () => {
      clearTimeout(timeoutId);
    };
  }, [price]);

  const direction = useMemo(() => (prevPrice < price ? 'up' : prevPrice > price ? 'down' : ''), [prevPrice, price]);

  return (
    <div className="container mx-auto p-4 font-sans">
      <div className="warning text-red-600 font-bold mb-2">
        FOR ENTERTAINMENT PURPOSES ONLY!<br />
        DO NOT USE THIS SITE AS FINANCIAL ADVICE!
      </div>
      <div className="ticker text-3xl font-extrabold mb-2">{symbol}</div>
      <div className={`price text-4xl font-bold mb-2 ${direction}`}>
        ${price} {directionEmojis[direction]}
      </div>
      <div className="price-time text-gray-600 mb-4">{priceTime && priceTime.toLocaleTimeString()}</div>
      <Chart options={chartOptions} series={series} type="candlestick" width="100%" height={320} />
    </div>
  );
}

export default App;
