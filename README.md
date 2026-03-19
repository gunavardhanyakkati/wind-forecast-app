# Wind Power Forecast Monitor

This repository contains the solution for the Wind Forecast Monitoring App and Data Analysis challenge.

## Project Structure
- **/frontend**: React + Vite + Chart.js application for dynamically visualizing generation vs forecasted generation based on dynamic horizons.
- **/backend**: Node.js + Express API acting as a proxy and computing the strict logic of extracting the **latest forecast published $H$ hours before the target time**.
- **/analysis**: Jupyter Notebook outlining the analysis of reliability and error constraints. 

## The Core Logic Addressed
The crux of this challenge involves isolating the latest forecast where `publishTime <= targetTime - horizon`. 
This is implemented tightly within the Node backend `filterForecasts()` function. It loops through all forecasts for a matching target time, truncates any that were predicted after the cutoff time ($T_{target} - H$), and retrieves the one with the maximum publish time.

## How to Start the Application

### 1. Start the Backend
```bash
cd backend
npm install
node index.js
```
The API will run on `http://localhost:5000/api/data`.

### 2. Start the Frontend
```bash
cd frontend
npm install
npm run dev
```
The App will launch automatically, traversing to `http://localhost:5173`. 
The frontend makes API calls to the backend, filtering data and displaying the chart.

### 3. Notebook
```bash
cd analysis
pip install pandas numpy matplotlib seaborn requests jupyter
jupyter notebook wind_forecast_analysis.ipynb
```
