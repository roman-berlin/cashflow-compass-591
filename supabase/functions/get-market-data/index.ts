import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('TWELVE_DATA_API_KEY');
    if (!apiKey) {
      throw new Error('TWELVE_DATA_API_KEY is not configured');
    }

    const ticker = 'SPY';
    
    // Fetch current price
    const priceUrl = `https://api.twelvedata.com/price?symbol=${ticker}&apikey=${apiKey}`;
    console.log('Fetching current price...');
    const priceResponse = await fetch(priceUrl);
    const priceData = await priceResponse.json();
    
    if (priceData.status === 'error') {
      throw new Error(priceData.message || 'Failed to fetch price data');
    }

    const lastPrice = parseFloat(priceData.price);

    // Fetch 52-week high using time series
    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 1);
    
    const formatDate = (d: Date) => d.toISOString().split('T')[0];
    
    const timeSeriesUrl = `https://api.twelvedata.com/time_series?symbol=${ticker}&interval=1day&start_date=${formatDate(startDate)}&end_date=${formatDate(endDate)}&apikey=${apiKey}`;
    console.log('Fetching time series for 52-week high...');
    const timeSeriesResponse = await fetch(timeSeriesUrl);
    const timeSeriesData = await timeSeriesResponse.json();

    if (timeSeriesData.status === 'error') {
      throw new Error(timeSeriesData.message || 'Failed to fetch time series data');
    }

    // Find 52-week high from the time series
    let high52w = 0;
    if (timeSeriesData.values && Array.isArray(timeSeriesData.values)) {
      for (const day of timeSeriesData.values) {
        const high = parseFloat(day.high);
        if (high > high52w) {
          high52w = high;
        }
      }
    }

    const result = {
      ticker,
      last_price: lastPrice,
      high_52w: high52w,
      as_of_date: formatDate(endDate),
    };

    console.log('Market data result:', result);

    return new Response(JSON.stringify(result), {
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
