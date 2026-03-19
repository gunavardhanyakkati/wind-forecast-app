import requests
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

def get_data(dataset, start, end):
    url = f"https://data.elexon.co.uk/bmrs/api/v1/datasets/{dataset}/stream?publishTimeFrom={start}&publishTimeTo={end}"
    res = requests.get(url)
    if res.status_code == 200:
        data = [d for d in res.json() if d.get('fuelType') == 'WIND']
        return pd.DataFrame(data)
    else:
        print(f"Failed {dataset}: {res.status_code}")
        return pd.DataFrame()

def run_analysis():
    # Jan 1 to Jan 7, 2025 as a sample
    start = "2025-01-01T00:00:00Z"
    end = "2025-01-08T00:00:00Z"
    
    print("Fetching Actuals...")
    actuals = get_data("FUELHH", start, end)
    print("Fetching Forecasts...")
    forecasts = get_data("WINDFOR", start, end)
    
    if actuals.empty or forecasts.empty:
        print("Required data missing.")
        return
        
    actuals['startTime'] = pd.to_datetime(actuals['startTime'])
    actuals = actuals[['startTime', 'generation']].rename(columns={'generation': 'actual'})
    
    forecasts['startTime'] = pd.to_datetime(forecasts['startTime'])
    forecasts['publishTime'] = pd.to_datetime(forecasts['publishTime'])
    
    # Calculate reliable generation
    p5 = np.percentile(actuals['actual'], 5)
    p10 = np.percentile(actuals['actual'], 10)
    p20 = np.percentile(actuals['actual'], 20)
    median = np.percentile(actuals['actual'], 50)
    
    print(f"\n--- RELIABILITY ANALYSIS ---")
    print(f"P5 (Available 95% of time): {p5:.1f} MW")
    print(f"P10(Available 90% of time): {p10:.1f} MW")
    print(f"P20(Available 80% of time): {p20:.1f} MW")
    print(f"Median Generation: {median:.1f} MW")
    
    # Horizons analysis
    horizons = [4, 12, 24, 48]
    print(f"\n--- ERROR ANALYSIS ---")
    actual_dict = actuals.set_index('startTime')['actual'].to_dict()
    
    for h in horizons:
        errors = []
        for t, act in actual_dict.items():
            cutoff = t - pd.Timedelta(hours=h)
            # forecasts for this time
            f_sub = forecasts[(forecasts['startTime'] == t) & (forecasts['publishTime'] <= cutoff)]
            if not f_sub.empty:
                latest = f_sub.loc[f_sub['publishTime'].idxmax()]
                err = latest['generation'] - act  # Positive = overforecast, Negative = underforecast
                errors.append(abs(err))
        
        if len(errors) > 0:
            err_series = pd.Series(errors)
            print(f"Horizon {h}H:")
            print(f"  Count: {len(errors)}")
            print(f"  Mean Absolute Error: {err_series.mean():.1f} MW")
            print(f"  Median Absolute Error: {err_series.median():.1f} MW")
            print(f"  P99 Absolute Error: {err_series.quantile(0.99):.1f} MW")
            
if __name__ == "__main__":
    run_analysis()
