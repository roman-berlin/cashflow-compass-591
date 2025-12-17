import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TimeSeriesPoint {
  date: string;
  close: number;
  return_pct: number;
  drawdown_pct: number;
}

interface TickerData {
  last_price: number;
  high_52w: number;
  current_drawdown: number;
  time_series: TimeSeriesPoint[];
  error?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('TWELVE_DATA_API_KEY');
    if (!apiKey) {
      throw new Error('TWELVE_DATA_API_KEY is not configured');
    }

    // Parse request body for tickers (default to SPY only)
    let tickers = ['SPY'];
    try {
      const body = await req.json();
      if (body.tickers && Array.isArray(body.tickers)) {
        tickers = body.tickers;
      }
    } catch {
      // No body or invalid JSON, use defaults
    }

    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 1);
    
    const formatDate = (d: Date) => d.toISOString().split('T')[0];

    const fetchTickerData = async (ticker: string): Promise<TickerData> => {
      try {
        console.log(`Fetching data for ${ticker}...`);
        
        // Fetch time series data for the past year
        const timeSeriesUrl = `https://api.twelvedata.com/time_series?symbol=${ticker}&interval=1day&start_date=${formatDate(startDate)}&end_date=${formatDate(endDate)}&apikey=${apiKey}`;
        const timeSeriesResponse = await fetch(timeSeriesUrl);
        const timeSeriesData = await timeSeriesResponse.json();

        if (timeSeriesData.status === 'error') {
          console.error(`Error fetching ${ticker}:`, timeSeriesData.message);
          return {
            last_price: 0,
            high_52w: 0,
            current_drawdown: 0,
            time_series: [],
            error: timeSeriesData.message || `Failed to fetch ${ticker} data`
          };
        }

        if (!timeSeriesData.values || !Array.isArray(timeSeriesData.values)) {
          return {
            last_price: 0,
            high_52w: 0,
            current_drawdown: 0,
            time_series: [],
            error: `No data available for ${ticker}`
          };
        }

        // Sort by date ascending (oldest first)
        const sortedValues = [...timeSeriesData.values].sort((a, b) => 
          new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
        );

        // Calculate metrics
        const firstClose = parseFloat(sortedValues[0].close);
        let high52w = 0;
        let runningHigh = 0;

        const timeSeries: TimeSeriesPoint[] = sortedValues.map((day) => {
          const close = parseFloat(day.close);
          const high = parseFloat(day.high);
          
          // Update 52-week high
          if (high > high52w) high52w = high;
          
          // Update running high for drawdown calculation
          if (close > runningHigh) runningHigh = close;
          
          // Calculate cumulative return from start
          const returnPct = ((close - firstClose) / firstClose) * 100;
          
          // Calculate drawdown from running high
          const drawdownPct = runningHigh > 0 ? ((runningHigh - close) / runningHigh) * 100 : 0;

          return {
            date: day.datetime,
            close,
            return_pct: Math.round(returnPct * 100) / 100,
            drawdown_pct: Math.round(drawdownPct * 100) / 100,
          };
        });

        const lastPrice = timeSeries.length > 0 ? timeSeries[timeSeries.length - 1].close : 0;
        const currentDrawdown = timeSeries.length > 0 ? timeSeries[timeSeries.length - 1].drawdown_pct : 0;

        return {
          last_price: lastPrice,
          high_52w: high52w,
          current_drawdown: currentDrawdown,
          time_series: timeSeries,
        };
      } catch (error) {
        console.error(`Error processing ${ticker}:`, error);
        return {
          last_price: 0,
          high_52w: 0,
          current_drawdown: 0,
          time_series: [],
          error: `Failed to process ${ticker} data`
        };
      }
    };

    // Fetch all tickers in parallel
    const tickerResults = await Promise.all(tickers.map(fetchTickerData));
    
    const result: Record<string, TickerData> = {};
    tickers.forEach((ticker, index) => {
      result[ticker] = tickerResults[index];
    });

    console.log('Market data result keys:', Object.keys(result));

    return new Response(JSON.stringify({
      tickers: result,
      as_of_date: formatDate(endDate),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Error in get-market-data function:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
